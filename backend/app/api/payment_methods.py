from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.payment_method import (
    PaymentMethodCreate,
    PaymentMethodResponse,
    PaymentMethodUpdate,
)
from app.services.payment_method_service import PaymentMethodService

router = APIRouter(prefix="/payment-methods", tags=["Payment Methods"])


@router.get("", response_model=list[PaymentMethodResponse])
async def list_payment_methods(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PaymentMethodService(db)
    return await service.list_for_user(current_user.id)


@router.post("", response_model=PaymentMethodResponse, status_code=201)
async def create_payment_method(
    data: PaymentMethodCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PaymentMethodService(db)
    return await service.create(data, current_user.id)


@router.delete("/{pm_id}", status_code=204)
async def delete_payment_method(
    pm_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID

    service = PaymentMethodService(db)
    await service.delete(UUID(pm_id), current_user.id)


@router.put("/{pm_id}", response_model=PaymentMethodResponse)
async def update_payment_method(
    pm_id: str,
    data: PaymentMethodUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID

    service = PaymentMethodService(db)
    return await service.update(UUID(pm_id), data, current_user.id)
