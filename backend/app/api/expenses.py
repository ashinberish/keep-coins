from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
    PaginatedExpenses,
)
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def _period_range(period: str) -> tuple[date, date]:
    today = date.today()
    if period == "week":
        return today - timedelta(days=today.weekday()), today
    if period == "month":
        return today.replace(day=1), today
    if period == "year":
        return today.replace(month=1, day=1), today
    # default: today
    return today, today


@router.get("", response_model=PaginatedExpenses)
async def list_expenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    period: str = Query("today"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ExpenseService(db)
    if date_from and date_to:
        df, dt = date_from, date_to
    elif period == "all":
        df, dt = None, None
    else:
        df, dt = _period_range(period)
    items, total = await service.list_expenses(current_user.id, page, page_size, df, dt)
    import math

    return PaginatedExpenses(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/stats/quick")
async def quick_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ExpenseService(db)
    today = date.today()
    month_start = today.replace(day=1)
    today_total = await service.total_for_range(current_user.id, today, today)
    month_total = await service.total_for_range(current_user.id, month_start, today)
    today_income = await service.income_for_range(current_user.id, today, today)
    month_income = await service.income_for_range(current_user.id, month_start, today)
    return {
        "today_total": float(today_total),
        "month_total": float(month_total),
        "today_income": float(today_income),
        "month_income": float(month_income),
    }


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ExpenseService(db)
    expense = await service.create_expense(data, current_user.id)
    return ExpenseResponse(
        id=expense.id,
        user_id=expense.user_id,
        category_id=expense.category_id,
        amount=expense.amount,
        type=expense.type,
        description=expense.description,
        date=expense.date,
        created_at=expense.created_at,
        account_id=expense.account_id,
        transfer_to_account_id=expense.transfer_to_account_id,
    )


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID

    service = ExpenseService(db)
    expense = await service.update_expense(UUID(expense_id), data, current_user.id)
    return ExpenseResponse(
        id=expense.id,
        user_id=expense.user_id,
        category_id=expense.category_id,
        amount=expense.amount,
        type=expense.type,
        description=expense.description,
        date=expense.date,
        created_at=expense.created_at,
        account_id=expense.account_id,
        transfer_to_account_id=expense.transfer_to_account_id,
    )


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID

    service = ExpenseService(db)
    await service.delete_expense(UUID(expense_id), current_user.id)
