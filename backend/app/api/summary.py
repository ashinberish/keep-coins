from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.summary_repository import SummaryRepository
from app.schemas.summary import MonthlySummaryResponse

router = APIRouter(prefix="/summary", tags=["Summary"])


@router.get("/monthly", response_model=MonthlySummaryResponse)
async def monthly_summary(
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SummaryRepository(db)
    return await repo.get_monthly_summary(current_user.id, year, month)
