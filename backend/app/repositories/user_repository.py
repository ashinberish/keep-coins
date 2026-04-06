import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_currency(self, user: User, currency: str) -> User:
        user.currency = currency
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_default_payment_method(
        self, user: User, payment_method_id: "uuid.UUID | None"
    ) -> User:
        user.default_payment_method_id = payment_method_id
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_username(self, user: User, username: str) -> User:
        user.username = username
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def soft_delete(self, user: User) -> None:
        user.is_active = False
        await self.db.commit()
