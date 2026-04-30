import random
import string
from pathlib import Path

import resend

from app.core.config import settings

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates"

resend.api_key = settings.RESEND_API_KEY


def generate_verification_code() -> str:
    return "".join(random.choices(string.digits, k=6))


def _render_otp_digits(code: str) -> str:
    cells = []
    for i, digit in enumerate(code):
        if i == 3:
            cells.append(
                '<td style="padding: 0 6px; font-size: 22px; color: #9ca3af;">'
                "&ndash;"
                "</td>"
            )
        cells.append(
            '<td style="'
            "padding: 0 4px;"
            '">'
            '<div style="'
            "width: 44px;"
            "height: 52px;"
            "line-height: 52px;"
            "text-align: center;"
            "font-size: 26px;"
            "font-weight: 700;"
            "color: #111827;"
            "background-color: #f3f4f6;"
            "border-radius: 8px;"
            "border: 1px solid #e5e7eb;"
            "font-family: 'Segoe UI', Arial, monospace;"
            f'">{digit}</div>'
            "</td>"
        )
    return "".join(cells)


def _build_html(code: str) -> str:
    template = (TEMPLATES_DIR / "verify_email.html").read_text(encoding="utf-8")
    html = template.replace("{{otp_digits}}", _render_otp_digits(code))
    html = html.replace(
        "{{expire_minutes}}", str(settings.VERIFICATION_CODE_EXPIRE_MINUTES)
    )
    return html


def send_verification_email(to_email: str, code: str) -> None:
    params: resend.Emails.SendParams = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": f"KeepCoins - Your verification code: {code}",
        "html": _build_html(code),
    }
    resend.Emails.send(params)


def send_password_reset_email(to_email: str, code: str) -> None:
    template = (TEMPLATES_DIR / "reset_password.html").read_text(encoding="utf-8")
    html = template.replace("{{otp_digits}}", _render_otp_digits(code))
    html = html.replace(
        "{{expire_minutes}}", str(settings.VERIFICATION_CODE_EXPIRE_MINUTES)
    )
    params: resend.Emails.SendParams = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": f"KeepCoins - Password reset code: {code}",
        "html": html,
    }
    resend.Emails.send(params)
