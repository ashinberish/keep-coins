import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.emi import Emi, EmiInstallment


class EmiRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_for_user(self, user_id: uuid.UUID) -> list[Emi]:
        result = await self.db.execute(
            select(Emi)
            .options(selectinload(Emi.installments))
            .where(Emi.user_id == user_id)
            .order_by(Emi.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, emi_id: uuid.UUID) -> Emi | None:
        result = await self.db.execute(
            select(Emi).options(selectinload(Emi.installments)).where(Emi.id == emi_id)
        )
        return result.scalar_one_or_none()

    async def create(self, emi: Emi) -> Emi:
        self.db.add(emi)
        await self.db.commit()
        await self.db.refresh(emi, attribute_names=["installments"])
        return emi

    async def delete(self, emi: Emi) -> None:
        await self.db.delete(emi)
        await self.db.commit()

    async def get_installment(self, installment_id: uuid.UUID) -> EmiInstallment | None:
        result = await self.db.execute(
            select(EmiInstallment).where(EmiInstallment.id == installment_id)
        )
        return result.scalar_one_or_none()

    async def update_installment(self, installment: EmiInstallment) -> EmiInstallment:
        await self.db.commit()
        await self.db.refresh(installment)
        return installment

    async def update_emi(self, emi: Emi) -> Emi:
        await self.db.commit()
        await self.db.refresh(emi, attribute_names=["installments"])
        return emi
