import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account


class AccountRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_for_user(self, user_id: uuid.UUID) -> list[Account]:
        result = await self.db.execute(
            select(Account).where(Account.user_id == user_id).order_by(Account.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, account_id: uuid.UUID) -> Account | None:
        result = await self.db.execute(select(Account).where(Account.id == account_id))
        return result.scalar_one_or_none()

    async def create(self, account: Account) -> Account:
        self.db.add(account)
        await self.db.commit()
        await self.db.refresh(account)
        return account

    async def update(self, account: Account) -> Account:
        await self.db.commit()
        await self.db.refresh(account)
        return account

    async def delete(self, account: Account) -> None:
        await self.db.delete(account)
        await self.db.commit()
