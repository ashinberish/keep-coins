import uuid
from datetime import date as Date
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    category_id: uuid.UUID | None = None
    amount: Decimal
    type: str = "expense"
    description: str | None = None
    date: Date
    account_id: uuid.UUID | None = None
    transfer_to_account_id: uuid.UUID | None = None


class ExpenseUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    amount: Decimal | None = None
    type: str | None = None
    description: str | None = None
    date: Date | None = None
    account_id: uuid.UUID | None = None
    transfer_to_account_id: uuid.UUID | None = None


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID | None
    amount: Decimal
    type: str = "expense"
    description: str | None
    date: Date
    created_at: datetime
    category_name: str | None = None
    account_id: uuid.UUID | None = None
    account_name: str | None = None
    transfer_to_account_id: uuid.UUID | None = None
    transfer_to_account_name: str | None = None

    model_config = {"from_attributes": True}


class PaginatedExpenses(BaseModel):
    items: list[ExpenseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
