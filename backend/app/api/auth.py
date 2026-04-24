from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    MessageResponse,
    RefreshTokenRequest,
    ResendCodeRequest,
    TokenResponse,
    UpdateCurrencyRequest,
    UpdateDefaultAccountRequest,
    UpdateUsernameRequest,
    UserCreate,
    UserLogin,
    UserResponse,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=201)
async def signup(data: UserCreate, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    user = await service.register(data)
    return user


@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.verify_email(data.email, data.code)


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    data: ResendCodeRequest, db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)
    return await service.resend_verification(data.email)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.login(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.refresh(data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me/currency", response_model=UserResponse)
async def update_currency(
    data: UpdateCurrencyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    return await repo.update_currency(current_user, data.currency)


@router.patch("/me/default-account", response_model=UserResponse)
async def update_default_account(
    data: UpdateDefaultAccountRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    return await repo.update_default_account(current_user, data.default_account_id)


@router.patch("/me/username", response_model=UserResponse)
async def update_username(
    data: UpdateUsernameRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    from fastapi import status as http_status

    repo = UserRepository(db)
    existing = await repo.get_by_username(data.username)
    if existing and existing.id != current_user.id:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    return await repo.update_username(current_user, data.username)


@router.post("/me/onboarding-complete", response_model=UserResponse)
async def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    return await repo.mark_onboarded(current_user)


@router.delete("/me", status_code=204)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    await repo.soft_delete(current_user)
    return None
