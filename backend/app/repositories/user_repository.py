import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(func.lower(User.email) == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.username == username.lower())
        )
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

    async def update_default_account(
        self, user: User, account_id: "uuid.UUID | None"
    ) -> User:
        user.default_account_id = account_id
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_username(self, user: User, username: str) -> User:
        user.username = username
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_name(self, user: User, full_name: str) -> User:
        user.full_name = full_name
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_theme(self, user: User, theme: str) -> User:
        user.theme = theme
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def mark_onboarded(self, user: User) -> User:
        user.is_onboarded = True
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def soft_delete(self, user: User) -> None:
        user.is_active = False
        user.email = f"{user.email}_deleted_{user.id}"
        await self.db.commit()
