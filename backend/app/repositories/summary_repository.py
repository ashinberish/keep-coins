import uuid

from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.expense import Expense


class SummaryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_monthly_summary(
        self, user_id: uuid.UUID, year: int, month: int
    ) -> dict:
        base = select(Expense).where(
            Expense.user_id == user_id,
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month,
        )

        # total
        total_result = await self.db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0)).select_from(
                base.subquery()
            )
        )
        total = float(total_result.scalar_one())

        # count
        count_result = await self.db.execute(
            select(func.count()).select_from(base.subquery())
        )
        count = count_result.scalar_one()

        # by category
        by_category_result = await self.db.execute(
            select(
                Category.name,
                Category.emoji,
                func.sum(Expense.amount).label("total"),
                func.count(Expense.id).label("count"),
            )
            .join(Category, Expense.category_id == Category.id)
            .where(
                Expense.user_id == user_id,
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == month,
            )
            .group_by(Category.id, Category.name, Category.emoji)
            .order_by(func.sum(Expense.amount).desc())
        )
        by_category = [
            {
                "name": row.name,
                "emoji": row.emoji,
                "total": float(row.total),
                "count": row.count,
            }
            for row in by_category_result.all()
        ]

        # daily totals
        daily_result = await self.db.execute(
            select(
                Expense.date,
                func.sum(Expense.amount).label("total"),
            )
            .where(
                Expense.user_id == user_id,
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == month,
            )
            .group_by(Expense.date)
            .order_by(Expense.date)
        )
        daily = [
            {"date": str(row.date), "total": float(row.total)}
            for row in daily_result.all()
        ]

        return {
            "year": year,
            "month": month,
            "total": total,
            "count": count,
            "by_category": by_category,
            "daily": daily,
        }
