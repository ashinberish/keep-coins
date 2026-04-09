import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.group import (
    AddMemberRequest,
    BalanceEntry,
    GroupCreate,
    GroupExpenseCreate,
    GroupExpenseResponse,
    GroupResponse,
    GroupUpdate,
    MemberInfo,
    SettlementCreate,
    SettlementResponse,
    UpdateMemberRoleRequest,
)
from app.services.group_service import GroupService

router = APIRouter(prefix="/groups", tags=["Groups"])


# ── Groups ───────────────────────────────────────────────────
@router.post("", response_model=GroupResponse, status_code=201)
async def create_group(
    data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    return await service.create_group(current_user.id, data)


@router.get("", response_model=list[GroupResponse])
async def list_groups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    return await service.list_groups(current_user.id)


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    return await service.get_group(group_id, current_user.id)


@router.patch("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: uuid.UUID,
    data: GroupUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    return await service.update_group(group_id, current_user.id, data)


@router.delete("/{group_id}", status_code=204)
async def delete_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    await service.delete_group(group_id, current_user.id)


# ── Members ──────────────────────────────────────────────────
@router.post("/{group_id}/members", response_model=GroupResponse)
async def add_member(
    group_id: uuid.UUID,
    data: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    return await service.add_member(group_id, current_user.id, data)


@router.delete("/{group_id}/members/{target_user_id}", status_code=204)
async def remove_member(
    group_id: uuid.UUID,
    target_user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    await service.remove_member(group_id, current_user.id, target_user_id)


@router.patch("/{group_id}/members/{target_user_id}", response_model=MemberInfo)
async def update_member_role(
    group_id: uuid.UUID,
    target_user_id: uuid.UUID,
    data: UpdateMemberRoleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    return await service.update_member_role(
        group_id, current_user.id, target_user_id, data
    )


# ── Expenses ─────────────────────────────────────────────────
@router.post(
    "/{group_id}/expenses",
    response_model=GroupExpenseResponse,
    status_code=201,
)
async def create_expense(
    group_id: uuid.UUID,
    data: GroupExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    return await service.create_expense(group_id, current_user.id, data)


@router.get("/{group_id}/expenses", response_model=list[GroupExpenseResponse])
async def list_expenses(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    return await service.list_expenses(group_id, current_user.id)


@router.delete("/{group_id}/expenses/{expense_id}", status_code=204)
async def delete_expense(
    group_id: uuid.UUID,
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    await service.delete_expense(group_id, expense_id, current_user.id)


# ── Settlements ──────────────────────────────────────────────
@router.post(
    "/{group_id}/settlements",
    response_model=SettlementResponse,
    status_code=201,
)
async def create_settlement(
    group_id: uuid.UUID,
    data: SettlementCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    return await service.create_settlement(group_id, current_user.id, data)


@router.get("/{group_id}/settlements", response_model=list[SettlementResponse])
async def list_settlements(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    return await service.list_settlements(group_id, current_user.id)


@router.delete("/{group_id}/settlements/{settlement_id}", status_code=204)
async def delete_settlement(
    group_id: uuid.UUID,
    settlement_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    await service.delete_settlement(group_id, settlement_id, current_user.id)


# ── Balances ─────────────────────────────────────────────────
@router.get("/{group_id}/balances", response_model=list[BalanceEntry])
async def get_balances(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = GroupService(db)
    return await service.get_balances(group_id, current_user.id)
