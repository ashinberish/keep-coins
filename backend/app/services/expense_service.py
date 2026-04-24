import uuid
from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense
from app.repositories.account_repository import AccountRepository
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


class ExpenseService:
    def __init__(self, db: AsyncSession):
        self.repo = ExpenseRepository(db)
        self.account_repo = AccountRepository(db)

    async def _apply_balance(
        self, txn_type: str, amount: Decimal, account_id, transfer_to_id, sign: int = 1
    ) -> None:
        """Adjust account balances. sign=1 for apply, sign=-1 for reverse.

        Only bank and cash accounts hold a balance. Debit cards redirect to
        their linked bank account. Credit cards are skipped entirely.
        """

        async def resolve(acct_id):
            """Follow a debit_card link to its underlying bank account."""
            if not acct_id:
                return None
            acct = await self.account_repo.get_by_id(acct_id)
            if acct and acct.type == "debit_card" and acct.linked_account_id:
                return await self.account_repo.get_by_id(acct.linked_account_id)
            return acct

        if txn_type == "income" and account_id:
            acct = await resolve(account_id)
            if acct and acct.type in ("bank", "cash"):
                acct.balance += amount * sign
        elif txn_type == "expense" and account_id:
            acct = await resolve(account_id)
            if acct and acct.type in ("bank", "cash"):
                acct.balance -= amount * sign
        elif txn_type == "transfer":
            if account_id:
                src = await resolve(account_id)
                if src and src.type in ("bank", "cash"):
                    src.balance -= amount * sign
            if transfer_to_id:
                dst = await resolve(transfer_to_id)
                if dst and dst.type in ("bank", "cash"):
                    dst.balance += amount * sign

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
            type=data.type,
            description=data.description,
            date=data.date,
            account_id=data.account_id,
            transfer_to_account_id=data.transfer_to_account_id,
        )
        await self._apply_balance(
            data.type, data.amount, data.account_id, data.transfer_to_account_id
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
        # Reverse old balance effect
        await self._apply_balance(
            expense.type,
            expense.amount,
            expense.account_id,
            expense.transfer_to_account_id,
            sign=-1,
        )
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(expense, field, value)
        # Apply new balance effect
        await self._apply_balance(
            expense.type,
            expense.amount,
            expense.account_id,
            expense.transfer_to_account_id,
        )
        return await self.repo.update(expense)

    async def delete_expense(self, expense_id: uuid.UUID, user_id: uuid.UUID) -> None:
        expense = await self.repo.get_by_id(expense_id)
        if not expense or expense.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
            )
        # Reverse balance effect
        await self._apply_balance(
            expense.type,
            expense.amount,
            expense.account_id,
            expense.transfer_to_account_id,
            sign=-1,
        )
        await self.repo.delete(expense)

    async def total_for_range(
        self, user_id: uuid.UUID, date_from: date, date_to: date
    ) -> float:
        return await self.repo.total_for_range(user_id, date_from, date_to)

    async def income_for_range(
        self, user_id: uuid.UUID, date_from: date, date_to: date
    ) -> float:
        return await self.repo.income_for_range(user_id, date_from, date_to)
