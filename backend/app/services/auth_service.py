from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.email import (
    generate_verification_code,
    send_password_reset_email,
    send_verification_email,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.account import Account
from app.models.user import User
from app.repositories.app_config_repository import AppConfigRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse, UserCreate, UserLogin


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserRepository(db)
        self.config_repo = AppConfigRepository(db)

    def _generate_and_set_code(self, user: User) -> str:
        code = generate_verification_code()
        user.verification_code = code
        user.verification_code_expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES
        )
        return code

    async def register(self, data: UserCreate) -> User:
        # Check if signups are enabled
        signup_config = await self.config_repo.get_by_key("signup.enabled")
        if signup_config and signup_config.value != "true":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Signups are currently disabled",
            )

        email = data.email.lower()
        if await self.repo.get_by_email(email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        if await self.repo.get_by_username(data.username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken",
            )

        user = User(
            email=email,
            username=data.username.lower(),
            hashed_password=hash_password(data.password),
            is_email_verified=False,
        )

        code = self._generate_and_set_code(user)
        user = await self.repo.create(user)

        # Create default CASH account and set it as default
        cash_acct = Account(
            user_id=user.id,
            name="Cash",
            icon="💵",
        )
        self.repo.db.add(cash_acct)
        await self.repo.db.flush()
        user.default_account_id = cash_acct.id
        await self.repo.db.commit()
        await self.repo.db.refresh(user)

        send_verification_email(email, code)

        return user

    async def login(self, data: UserLogin) -> TokenResponse:
        user = await self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )
        if not user.is_email_verified:
            code = self._generate_and_set_code(user)
            await self.repo.db.commit()
            send_verification_email(user.email, code)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. A new verification code has been sent.",
            )

        return TokenResponse(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
        )

    async def verify_email(self, email: str, code: str) -> TokenResponse:
        user = await self.repo.get_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        if user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already verified",
            )
        if not user.verification_code or not user.verification_code_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No verification code found. Please request a new one.",
            )
        if datetime.now(timezone.utc) > user.verification_code_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new one.",
            )
        if user.verification_code != code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code",
            )

        user.is_email_verified = True
        user.verification_code = None
        user.verification_code_expires_at = None
        await self.repo.db.commit()

        return TokenResponse(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
        )

    async def resend_verification(self, email: str) -> dict:
        user = await self.repo.get_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        if user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already verified",
            )

        code = self._generate_and_set_code(user)
        await self.repo.db.commit()
        send_verification_email(user.email, code)

        return {"message": "Verification code sent"}

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        from uuid import UUID

        user = await self.repo.get_by_id(UUID(user_id))
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or deactivated",
            )

        return TokenResponse(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
        )

    async def forgot_password(self, email: str) -> dict:
        user = await self.repo.get_by_email(email)
        if not user:
            return {
                "message": "If that email is registered, a reset code has been sent."
            }
        if not user.is_active:
            return {
                "message": "If that email is registered, a reset code has been sent."
            }

        code = self._generate_and_set_code(user)
        await self.repo.db.commit()
        send_password_reset_email(user.email, code)

        return {"message": "If that email is registered, a reset code has been sent."}

    async def reset_password(self, email: str, code: str, new_password: str) -> dict:
        user = await self.repo.get_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset request",
            )
        if not user.verification_code or not user.verification_code_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No reset code found. Please request a new one.",
            )
        if datetime.now(timezone.utc) > user.verification_code_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset code has expired. Please request a new one.",
            )
        if user.verification_code != code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset code",
            )

        user.hashed_password = hash_password(new_password)
        user.verification_code = None
        user.verification_code_expires_at = None
        await self.repo.db.commit()

        return {"message": "Password has been reset successfully"}
