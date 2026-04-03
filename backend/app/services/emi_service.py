import uuid

from dateutil.relativedelta import relativedelta
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.emi import Emi, EmiInstallment
from app.repositories.emi_repository import EmiRepository
from app.schemas.emi import EmiCreate, InstallmentUpdate


class EmiService:
    def __init__(self, db: AsyncSession):
        self.repo = EmiRepository(db)

    async def list_emis(self, user_id: uuid.UUID) -> list[Emi]:
        return await self.repo.list_for_user(user_id)

    async def create_emi(self, data: EmiCreate, user_id: uuid.UUID) -> Emi:
        emi = Emi(
            user_id=user_id,
            name=data.name,
            monthly_amount=data.monthly_amount,
            total_months=data.total_months,
            start_date=data.start_date,
        )

        for i in range(data.total_months):
            due = data.start_date + relativedelta(months=i)
            emi.installments.append(
                EmiInstallment(
                    month_number=i + 1,
                    due_date=due,
                    amount=data.monthly_amount,
                    is_paid=False,
                )
            )

        return await self.repo.create(emi)

    async def delete_emi(self, emi_id: uuid.UUID, user_id: uuid.UUID) -> None:
        emi = await self.repo.get_by_id(emi_id)
        if not emi or emi.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="EMI not found"
            )
        await self.repo.delete(emi)

    async def update_installment(
        self, installment_id: uuid.UUID, data: InstallmentUpdate, user_id: uuid.UUID
    ) -> EmiInstallment:
        installment = await self.repo.get_installment(installment_id)
        if not installment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Installment not found",
            )
        # verify ownership
        emi = await self.repo.get_by_id(installment.emi_id)
        if not emi or emi.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Installment not found",
            )
        if data.amount is not None:
            installment.amount = data.amount
        if data.is_paid is not None:
            installment.is_paid = data.is_paid
        return await self.repo.update_installment(installment)
