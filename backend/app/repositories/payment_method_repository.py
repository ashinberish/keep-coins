import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment_method import PaymentMethod


class PaymentMethodRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_for_user(self, user_id: uuid.UUID) -> list[PaymentMethod]:
        result = await self.db.execute(
            select(PaymentMethod)
            .where(PaymentMethod.user_id == user_id)
            .order_by(PaymentMethod.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, pm_id: uuid.UUID) -> PaymentMethod | None:
        result = await self.db.execute(
            select(PaymentMethod).where(PaymentMethod.id == pm_id)
        )
        return result.scalar_one_or_none()

    async def create(self, pm: PaymentMethod) -> PaymentMethod:
        self.db.add(pm)
        await self.db.commit()
        await self.db.refresh(pm)
        return pm

    async def update(self, pm: PaymentMethod) -> PaymentMethod:
        await self.db.commit()
        await self.db.refresh(pm)
        return pm

    async def delete(self, pm: PaymentMethod) -> None:
        await self.db.delete(pm)
        await self.db.commit()
