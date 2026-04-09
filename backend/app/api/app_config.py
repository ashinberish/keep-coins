from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.app_config_repository import AppConfigRepository
from app.schemas.app_config import AppConfigResponse, AppConfigUpdate

router = APIRouter(prefix="/config", tags=["Configuration"])


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
