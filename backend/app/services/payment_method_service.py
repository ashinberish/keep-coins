import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment_method import PaymentMethod
from app.repositories.payment_method_repository import PaymentMethodRepository
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodUpdate


class PaymentMethodService:
    def __init__(self, db: AsyncSession):
        self.repo = PaymentMethodRepository(db)

    async def list_for_user(self, user_id: uuid.UUID) -> list[PaymentMethod]:
        return await self.repo.list_for_user(user_id)

    async def create(
        self, data: PaymentMethodCreate, user_id: uuid.UUID
    ) -> PaymentMethod:
        pm = PaymentMethod(
            user_id=user_id,
            name=data.name,
            icon=data.icon,
            balance=data.balance,
            debt=data.debt,
        )
        return await self.repo.create(pm)

    async def update(
        self, pm_id: uuid.UUID, data: PaymentMethodUpdate, user_id: uuid.UUID
    ) -> PaymentMethod:
        pm = await self.repo.get_by_id(pm_id)
        if not pm or pm.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found",
            )
        if data.name is not None:
            pm.name = data.name
        if data.icon is not None:
            pm.icon = data.icon
        if data.balance is not None:
            pm.balance = data.balance
        if data.debt is not None:
            pm.debt = data.debt
        return await self.repo.update(pm)

    async def delete(self, pm_id: uuid.UUID, user_id: uuid.UUID) -> None:
        pm = await self.repo.get_by_id(pm_id)
        if not pm or pm.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment method not found",
            )
        await self.repo.delete(pm)
