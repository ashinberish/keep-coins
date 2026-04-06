from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.emi import (
    EmiCreate,
    EmiResponse,
    EmiUpdate,
    InstallmentResponse,
    InstallmentUpdate,
)
from app.services.emi_service import EmiService

router = APIRouter(prefix="/emis", tags=["EMIs"])


@router.get("", response_model=list[EmiResponse])
async def list_emis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = EmiService(db)
    return await service.list_emis(current_user.id)


@router.post("", response_model=EmiResponse, status_code=201)
async def create_emi(
    data: EmiCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = EmiService(db)
    return await service.create_emi(data, current_user.id)


@router.delete("/{emi_id}", status_code=204)
async def delete_emi(
    emi_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID

    service = EmiService(db)
    await service.delete_emi(UUID(emi_id), current_user.id)


@router.patch("/{emi_id}", response_model=EmiResponse)
async def update_emi(
    emi_id: str,
    data: EmiUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID

    service = EmiService(db)
    return await service.update_emi(UUID(emi_id), data, current_user.id)


@router.patch("/installments/{installment_id}", response_model=InstallmentResponse)
async def update_installment(
    installment_id: str,
    data: InstallmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID

    service = EmiService(db)
    return await service.update_installment(UUID(installment_id), data, current_user.id)
