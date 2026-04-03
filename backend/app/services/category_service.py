import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.repo = CategoryRepository(db)

    async def list_categories(self, user_id: uuid.UUID) -> list[Category]:
        return await self.repo.get_all_for_user(user_id)

    async def create_category(
        self, data: CategoryCreate, user_id: uuid.UUID
    ) -> Category:
        existing = await self.repo.get_by_name_and_user(data.name, user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category with this name already exists",
            )
        category = Category(
            name=data.name,
            emoji=data.emoji,
            description=data.description,
            user_id=user_id,
        )
        return await self.repo.create(category)

    async def delete_category(self, category_id: uuid.UUID, user_id: uuid.UUID) -> None:
        category = await self.repo.get_by_id(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
            )
        if category.user_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete default categories",
            )
        if category.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not allowed to delete this category",
            )
        await self.repo.delete(category)
