import uuid
from datetime import date as Date
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    category_id: uuid.UUID
    amount: Decimal
    description: str | None = None
    date: Date


class ExpenseUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    amount: Decimal | None = None
    description: str | None = None
    date: Date | None = None


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    amount: Decimal
    description: str | None
    date: Date
    created_at: datetime
    category_name: str | None = None

    model_config = {"from_attributes": True}


class PaginatedExpenses(BaseModel):
    items: list[ExpenseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
