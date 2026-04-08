import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class AccountCreate(BaseModel):
    name: str
    icon: str = "💳"
    type: str = "bank"
    credit_limit: Decimal | None = None
    balance: Decimal = Decimal("0")
    debt: Decimal = Decimal("0")


class AccountUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    type: str | None = None
    credit_limit: Decimal | None = None
    balance: Decimal | None = None
    debt: Decimal | None = None


class AccountResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    icon: str
    type: str
    credit_limit: Decimal | None = None
    balance: Decimal
    debt: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}
