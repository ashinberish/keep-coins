import uuid
from datetime import date as Date
from datetime import datetime

from pydantic import BaseModel


class EmiCreate(BaseModel):
    name: str
    monthly_amount: float
    total_months: int
    start_date: Date


class InstallmentResponse(BaseModel):
    id: uuid.UUID
    month_number: int
    due_date: Date
    amount: float
    is_paid: bool

    model_config = {"from_attributes": True}


class EmiResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    monthly_amount: float
    total_months: int
    start_date: Date
    created_at: datetime
    installments: list[InstallmentResponse] = []

    model_config = {"from_attributes": True}


class InstallmentToggle(BaseModel):
    is_paid: bool


class InstallmentUpdate(BaseModel):
    amount: float | None = None
    is_paid: bool | None = None
