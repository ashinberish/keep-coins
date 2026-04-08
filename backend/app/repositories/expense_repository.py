import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.account import Account
from app.models.category import Category
from app.models.expense import Expense

TransferToAccount = aliased(Account)


class ExpenseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_paginated_for_user(
        self,
        user_id: uuid.UUID,
        page: int,
        page_size: int,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> tuple[list[dict], int]:
        base = select(Expense).where(Expense.user_id == user_id)
        if date_from:
            base = base.where(Expense.date >= date_from)
        if date_to:
            base = base.where(Expense.date <= date_to)

        count_result = await self.db.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = count_result.scalar_one()

        result = await self.db.execute(
            select(
                Expense,
                Category.name.label("category_name"),
                Account.name.label("account_name"),
                TransferToAccount.name.label("transfer_to_account_name"),
            )
            .outerjoin(Category, Expense.category_id == Category.id)
            .outerjoin(Account, Expense.account_id == Account.id)
            .outerjoin(
                TransferToAccount,
                Expense.transfer_to_account_id == TransferToAccount.id,
            )
            .where(Expense.user_id == user_id)
            .where(Expense.date >= date_from if date_from else True)
            .where(Expense.date <= date_to if date_to else True)
            .order_by(Expense.date.desc(), Expense.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = result.all()
        items = []
        for expense, cat_name, acct_name, transfer_to_acct_name in rows:
            items.append(
                {
                    "id": expense.id,
                    "user_id": expense.user_id,
                    "category_id": expense.category_id,
                    "amount": expense.amount,
                    "type": expense.type,
                    "description": expense.description,
                    "date": expense.date,
                    "created_at": expense.created_at,
                    "category_name": cat_name,
                    "account_id": expense.account_id,
                    "account_name": acct_name,
                    "transfer_to_account_id": expense.transfer_to_account_id,
                    "transfer_to_account_name": transfer_to_acct_name,
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

    async def total_for_range(
        self, user_id: uuid.UUID, date_from: date, date_to: date
    ) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.user_id == user_id,
                Expense.type == "expense",
                Expense.date >= date_from,
                Expense.date <= date_to,
            )
        )
        return result.scalar_one()

    async def income_for_range(
        self, user_id: uuid.UUID, date_from: date, date_to: date
    ) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.user_id == user_id,
                Expense.type == "income",
                Expense.date >= date_from,
                Expense.date <= date_to,
            )
        )
        return result.scalar_one()
