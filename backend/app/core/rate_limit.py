import time
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.security_monitor import track_response

# rate limit: (max_requests, window_seconds)
AUTH_LIMIT = (10, 60)  # 10 requests per 60s for auth endpoints
API_LIMIT = (60, 60)  # 60 requests per 60s for general API


class _TokenBucket:
    __slots__ = ("capacity", "refill_rate", "tokens", "last_refill")

    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.refill_rate = refill_rate  # tokens per second
        self.tokens = float(capacity)
        self.last_refill = time.monotonic()

    def consume(self) -> bool:
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False


# Store buckets per (client_ip, bucket_type)
_buckets: dict[tuple[str, str], _TokenBucket] = defaultdict()
_last_cleanup = time.monotonic()


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _get_bucket(key: tuple[str, str], capacity: int, window: int) -> _TokenBucket:
    if key not in _buckets:
        _buckets[key] = _TokenBucket(capacity, capacity / window)
    return _buckets[key]


def _cleanup_stale_buckets() -> None:
    """Remove buckets that have been idle for over 5 minutes."""
    global _last_cleanup
    now = time.monotonic()
    if now - _last_cleanup < 300:
        return
    _last_cleanup = now
    stale_keys = [k for k, b in _buckets.items() if now - b.last_refill > 300]
    for k in stale_keys:
        del _buckets[k]


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # Skip non-API paths and health check
        if not path.startswith("/api") or path == "/api/health":
            return await call_next(request)

        client_ip = _get_client_ip(request)
        _cleanup_stale_buckets()

        # Stricter limit for auth endpoints
        if path.startswith("/api/auth"):
            capacity, window = AUTH_LIMIT
            bucket_type = "auth"
        else:
            capacity, window = API_LIMIT
            bucket_type = "api"

        bucket = _get_bucket((client_ip, bucket_type), capacity, window)

        if not bucket.consume():
            track_response(client_ip, path, 429)
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": str(window)},
            )

        response = await call_next(request)
        track_response(client_ip, path, response.status_code)
        return response
