import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


class ExpenseService:
    def __init__(self, db: AsyncSession):
        self.repo = ExpenseRepository(db)

    async def list_expenses(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 10,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> tuple[list[dict], int]:
        return await self.repo.get_paginated_for_user(
            user_id, page, page_size, date_from, date_to
        )

    async def create_expense(self, data: ExpenseCreate, user_id: uuid.UUID) -> Expense:
        expense = Expense(
            user_id=user_id,
            category_id=data.category_id,
            amount=data.amount,
            description=data.description,
            date=data.date,
        )
        return await self.repo.create(expense)

    async def update_expense(
        self, expense_id: uuid.UUID, data: ExpenseUpdate, user_id: uuid.UUID
    ) -> Expense:
        expense = await self.repo.get_by_id(expense_id)
        if not expense or expense.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
            )
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(expense, field, value)
        return await self.repo.update(expense)

    async def delete_expense(self, expense_id: uuid.UUID, user_id: uuid.UUID) -> None:
        expense = await self.repo.get_by_id(expense_id)
        if not expense or expense.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
            )
        await self.repo.delete(expense)

    async def total_for_range(
        self, user_id: uuid.UUID, date_from: date, date_to: date
    ) -> float:
        return await self.repo.total_for_range(user_id, date_from, date_to)
