import uuid
from datetime import date as Date
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


# --- Group ---
class GroupCreate(BaseModel):
    name: str
    description: str | None = None
    icon: str = "👥"


class GroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None


class MemberInfo(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    username: str
    email: str
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class GroupResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    icon: str
    created_by: uuid.UUID
    created_at: datetime
    members: list[MemberInfo] = []

    model_config = {"from_attributes": True}


# --- Group Expense ---
class SplitItem(BaseModel):
    user_id: uuid.UUID
    amount: Decimal


class GroupExpenseCreate(BaseModel):
    amount: Decimal
    description: str
    date: Date
    split_type: str = "equal"
    splits: list[SplitItem] | None = None


class GroupExpenseUpdate(BaseModel):
    amount: Decimal | None = None
    description: str | None = None
    date: Date | None = None
    split_type: str | None = None
    splits: list[SplitItem] | None = None


class SplitResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    username: str
    amount: Decimal
    is_settled: bool

    model_config = {"from_attributes": True}


class GroupExpenseResponse(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    paid_by: uuid.UUID
    paid_by_username: str = ""
    amount: Decimal
    description: str
    date: Date
    split_type: str
    created_at: datetime
    splits: list[SplitResponse] = []

    model_config = {"from_attributes": True}


# --- Settlement ---
class SettlementCreate(BaseModel):
    paid_to: uuid.UUID
    amount: Decimal
    date: Date


class SettlementResponse(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    paid_by: uuid.UUID
    paid_by_username: str = ""
    paid_to: uuid.UUID
    paid_to_username: str = ""
    amount: Decimal
    date: Date
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Balances ---
class BalanceEntry(BaseModel):
    user_id: uuid.UUID
    username: str
    balance: Decimal


# --- Add member ---
class AddMemberRequest(BaseModel):
    username: str


class UpdateMemberRoleRequest(BaseModel):
    role: str
