import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.expense import Expense


class ExpenseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_paginated_for_user(
        self, user_id: uuid.UUID, page: int, page_size: int
    ) -> tuple[list[dict], int]:
        base = select(Expense).where(Expense.user_id == user_id)

        count_result = await self.db.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = count_result.scalar_one()

        result = await self.db.execute(
            select(Expense, Category.name.label("category_name"))
            .join(Category, Expense.category_id == Category.id)
            .where(Expense.user_id == user_id)
            .order_by(Expense.date.desc(), Expense.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = result.all()
        items = []
        for expense, cat_name in rows:
            items.append(
                {
                    "id": expense.id,
                    "user_id": expense.user_id,
                    "category_id": expense.category_id,
                    "amount": expense.amount,
                    "description": expense.description,
                    "date": expense.date,
                    "created_at": expense.created_at,
                    "category_name": cat_name,
                }
            )
        return items, total

    async def get_by_id(self, expense_id: uuid.UUID) -> Expense | None:
        result = await self.db.execute(select(Expense).where(Expense.id == expense_id))
        return result.scalar_one_or_none()

    async def create(self, expense: Expense) -> Expense:
        self.db.add(expense)
        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    async def update(self, expense: Expense) -> Expense:
        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    async def delete(self, expense: Expense) -> None:
        await self.db.delete(expense)
        await self.db.commit()
