from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.app_config_repository import AppConfigRepository
from app.schemas.app_config import (
    AppConfigResponse,
    AppConfigUpdate,
    PublicConfigResponse,
    SidebarButtonConfig,
)

router = APIRouter(prefix="/config", tags=["Configuration"])


@router.get("/public", response_model=PublicConfigResponse)
async def get_public_config(db: AsyncSession = Depends(get_db)):
    """Public endpoint - no auth required. Returns signup status and sidebar button."""
    repo = AppConfigRepository(db)
    signup = await repo.get_by_key("signup.enabled")

    # Sidebar button
    sb_configs = await repo.list_by_prefix("sidebar_button.")
    sb_map = {c.key: c.value for c in sb_configs}
    sidebar_button = None
    if sb_map.get("sidebar_button.enabled") == "true":
        sidebar_button = SidebarButtonConfig(
            enabled=True,
            label=sb_map.get("sidebar_button.label", ""),
            url=sb_map.get("sidebar_button.url", ""),
            variant=sb_map.get("sidebar_button.variant", "outline"),
        )

    return PublicConfigResponse(
        signup_enabled=signup.value == "true" if signup else True,
        sidebar_button=sidebar_button,
    )


@router.get("", response_model=list[AppConfigResponse])
async def list_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = AppConfigRepository(db)
    return await repo.list_all()


@router.patch("/{config_id}", response_model=AppConfigResponse)
async def update_config(
    config_id: int,
    data: AppConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    repo = AppConfigRepository(db)
    item = await repo.update_value(config_id, data.value)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config not found",
        )
    return item
