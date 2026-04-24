import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel

AccountType = Literal["bank", "cash", "debit_card", "credit_card"]


class AccountCreate(BaseModel):
    name: str
    icon: str = "💳"
    type: AccountType = "bank"
    linked_account_id: uuid.UUID | None = None  # debit_card only
    credit_limit: Decimal | None = None  # credit_card only
    balance: Decimal = Decimal("0")
    debt: Decimal = Decimal("0")


class AccountUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    type: AccountType | None = None
    linked_account_id: uuid.UUID | None = None
    credit_limit: Decimal | None = None
    balance: Decimal | None = None
    debt: Decimal | None = None


class AccountResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    icon: str
    type: str
    linked_account_id: uuid.UUID | None = None
    credit_limit: Decimal | None = None
    balance: Decimal
    debt: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}
