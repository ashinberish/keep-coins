from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.app_config import AppConfig


class AppConfigRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_all(self) -> list[AppConfig]:
        result = await self.db.execute(select(AppConfig).order_by(AppConfig.id))
        return list(result.scalars().all())

    async def list_by_prefix(self, prefix: str) -> list[AppConfig]:
        result = await self.db.execute(
            select(AppConfig)
            .where(AppConfig.key.startswith(prefix))
            .order_by(AppConfig.id)
        )
        return list(result.scalars().all())

    async def get_by_key(self, key: str) -> AppConfig | None:
        result = await self.db.execute(select(AppConfig).where(AppConfig.key == key))
        return result.scalar_one_or_none()

    async def update_value(self, config_id: int, value: str) -> AppConfig | None:
        result = await self.db.execute(
            select(AppConfig).where(AppConfig.id == config_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            return None
        item.value = value
        await self.db.commit()
        await self.db.refresh(item)
        return item
