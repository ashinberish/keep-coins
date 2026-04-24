import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.repositories.account_repository import AccountRepository
from app.schemas.account import AccountCreate, AccountUpdate


class AccountService:
    def __init__(self, db: AsyncSession):
        self.repo = AccountRepository(db)

    async def list_for_user(self, user_id: uuid.UUID) -> list[Account]:
        return await self.repo.list_for_user(user_id)

    async def create(self, data: AccountCreate, user_id: uuid.UUID) -> Account:
        account = Account(
            user_id=user_id,
            name=data.name,
            icon=data.icon,
            type=data.type,
            linked_account_id=data.linked_account_id,
            credit_limit=data.credit_limit,
            balance=data.balance,
            debt=data.debt,
        )
        return await self.repo.create(account)

    async def update(
        self, account_id: uuid.UUID, data: AccountUpdate, user_id: uuid.UUID
    ) -> Account:
        account = await self.repo.get_by_id(account_id)
        if not account or account.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found",
            )
        if data.name is not None:
            account.name = data.name
        if data.icon is not None:
            account.icon = data.icon
        if data.type is not None:
            account.type = data.type
        if data.linked_account_id is not None:
            account.linked_account_id = data.linked_account_id
        if data.credit_limit is not None:
            account.credit_limit = data.credit_limit
        if data.balance is not None:
            account.balance = data.balance
        if data.debt is not None:
            account.debt = data.debt
        return await self.repo.update(account)

    async def delete(self, account_id: uuid.UUID, user_id: uuid.UUID) -> None:
        account = await self.repo.get_by_id(account_id)
        if not account or account.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found",
            )
        await self.repo.delete(account)
