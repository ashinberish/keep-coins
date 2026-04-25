import asyncio
import logging
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger("security_monitor")

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates"

# ---------------------------------------------------------------------------
# Thresholds & cooldowns
# ---------------------------------------------------------------------------
# (event_count_threshold, tracking_window_seconds)
THRESHOLDS: dict[str, tuple[int, int]] = {
    "rate_limited": (5, 600),  # 5 rate-limit hits in 10 min
    "auth_failure": (5, 600),  # 5 failed logins in 10 min
    "forbidden": (10, 600),  # 10 forbidden attempts in 10 min
    "not_found": (20, 600),  # 20 404s in 10 min (path scanning)
}
ALERT_COOLDOWN = 1800  # don't re-alert same IP+event for 30 min

# ---------------------------------------------------------------------------
# In-memory tracking
# ---------------------------------------------------------------------------
# {(ip, event_type): [timestamp, ...]}
_events: dict[tuple[str, str], list[float]] = defaultdict(list)
# {(ip, event_type): last_alert_timestamp}
_alert_cooldowns: dict[tuple[str, str], float] = {}
_last_cleanup = time.monotonic()


def _cleanup() -> None:
    global _last_cleanup
    now = time.monotonic()
    if now - _last_cleanup < 300:
        return
    _last_cleanup = now
    cutoff = now - 600
    stale = [k for k, v in _events.items() if not v or v[-1] < cutoff]
    for k in stale:
        del _events[k]
    stale_cd = [k for k, t in _alert_cooldowns.items() if now - t > ALERT_COOLDOWN]
    for k in stale_cd:
        del _alert_cooldowns[k]


def _record_event(ip: str, event_type: str, path: str) -> None:
    """Record a suspicious event and fire an alert if threshold crossed."""
    now = time.monotonic()
    key = (ip, event_type)
    _events[key].append(now)
    _cleanup()

    threshold, window = THRESHOLDS.get(event_type, (10, 600))
    cutoff = now - window
    _events[key] = [t for t in _events[key] if t > cutoff]

    if len(_events[key]) >= threshold:
        if now - _alert_cooldowns.get(key, 0) < ALERT_COOLDOWN:
            return
        _alert_cooldowns[key] = now
        count = len(_events[key])
        _send_alert_async(ip, event_type, count, window, path)


# ---------------------------------------------------------------------------
# Alerting (non-blocking)
# ---------------------------------------------------------------------------
_EVENT_LABELS = {
    "rate_limited": "Rate Limit Exceeded",
    "auth_failure": "Failed Authentication Attempts",
    "forbidden": "Forbidden Access Attempts",
    "not_found": "Suspicious Path Scanning (404s)",
}


def _build_alert_html(
    ip: str, event_type: str, count: int, window: int, path: str
) -> str:
    label = _EVENT_LABELS.get(event_type, event_type)
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    html = (TEMPLATES_DIR / "security_alert.html").read_text(encoding="utf-8")
    html = html.replace("{{label}}", label)
    html = html.replace("{{timestamp}}", now_str)
    html = html.replace("{{ip}}", ip)
    html = html.replace("{{count}}", str(count))
    html = html.replace("{{window_minutes}}", str(window // 60))
    html = html.replace("{{path}}", path)
    return html


def _send_alert_async(
    ip: str, event_type: str, count: int, window: int, path: str
) -> None:
    if not settings.ALERT_EMAIL or not settings.RESEND_API_KEY:
        label = _EVENT_LABELS.get(event_type, event_type)
        logger.warning(
            "SECURITY ALERT [%s] IP=%s count=%d path=%s (email not configured)",
            label,
            ip,
            count,
            path,
        )
        return

    async def _send() -> None:
        try:
            import resend

            label = _EVENT_LABELS.get(event_type, event_type)
            resend.api_key = settings.RESEND_API_KEY
            params: resend.Emails.SendParams = {
                "from": settings.RESEND_FROM_EMAIL,
                "to": [settings.ALERT_EMAIL],
                "subject": f"🚨 KeepCoins Security Alert – {label} from {ip}",
                "html": _build_alert_html(ip, event_type, count, window, path),
            }
            resend.Emails.send(params)
        except Exception:
            logger.exception("Failed to send security alert email")

    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_send())
    except RuntimeError:
        logger.warning("No event loop – skipping async alert email")


# ---------------------------------------------------------------------------
# Public helpers (called from middleware)
# ---------------------------------------------------------------------------
def track_response(ip: str, path: str, status_code: int) -> None:
    """Classify response and record suspicious events."""
    if status_code == 429:
        _record_event(ip, "rate_limited", path)
    elif status_code == 401 and path.startswith("/api/auth"):
        _record_event(ip, "auth_failure", path)
    elif status_code == 403:
        _record_event(ip, "forbidden", path)
    elif status_code == 404 and path.startswith("/api"):
        _record_event(ip, "not_found", path)
