import uuid
from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.group import (
    Group,
    GroupExpense,
    GroupExpenseSplit,
    GroupMember,
    GroupSettlement,
)
from app.repositories.group_repository import GroupRepository
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
    SplitResponse,
    UpdateMemberRoleRequest,
)


class GroupService:
    def __init__(self, db: AsyncSession):
        self.repo = GroupRepository(db)
        self.db = db

    # ── helpers ─────────────────────────────────────────────
    async def _assert_member(
        self, group_id: uuid.UUID, user_id: uuid.UUID
    ) -> GroupMember:
        member = await self.repo.get_member(group_id, user_id)
        if not member:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a group member")
        return member

    async def _assert_admin(
        self, group_id: uuid.UUID, user_id: uuid.UUID
    ) -> GroupMember:
        member = await self._assert_member(group_id, user_id)
        if member.role != "admin":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
        return member

    async def _build_group_response(self, group: Group) -> GroupResponse:
        members = await self.repo.list_members(group.id)
        user_ids = [m.user_id for m in members]
        usernames = await self.repo.get_usernames(user_ids)
        users_map: dict[uuid.UUID, dict] = {}
        for uid in user_ids:
            u = await self.repo.get_user(uid)
            if u:
                users_map[uid] = {"username": u.username, "email": u.email}

        member_infos = [
            MemberInfo(
                id=m.id,
                user_id=m.user_id,
                username=users_map.get(m.user_id, {}).get("username", ""),
                email=users_map.get(m.user_id, {}).get("email", ""),
                role=m.role,
                joined_at=m.joined_at,
            )
            for m in members
        ]
        return GroupResponse(
            id=group.id,
            name=group.name,
            description=group.description,
            icon=group.icon,
            created_by=group.created_by,
            created_at=group.created_at,
            members=member_infos,
        )

    # ── Groups ──────────────────────────────────────────────
    async def create_group(
        self, user_id: uuid.UUID, data: GroupCreate
    ) -> GroupResponse:
        group = Group(
            name=data.name,
            description=data.description,
            icon=data.icon,
            created_by=user_id,
        )
        group = await self.repo.create_group(group)
        admin_member = GroupMember(group_id=group.id, user_id=user_id, role="admin")
        await self.repo.add_member(admin_member)
        return await self._build_group_response(group)

    async def list_groups(self, user_id: uuid.UUID) -> list[GroupResponse]:
        groups = await self.repo.list_groups_for_user(user_id)
        return [await self._build_group_response(g) for g in groups]

    async def get_group(self, group_id: uuid.UUID, user_id: uuid.UUID) -> GroupResponse:
        group = await self.repo.get_group(group_id)
        if not group:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")
        await self._assert_member(group_id, user_id)
        return await self._build_group_response(group)

    async def update_group(
        self, group_id: uuid.UUID, user_id: uuid.UUID, data: GroupUpdate
    ) -> GroupResponse:
        group = await self.repo.get_group(group_id)
        if not group:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")
        await self._assert_admin(group_id, user_id)
        if data.name is not None:
            group.name = data.name
        if data.description is not None:
            group.description = data.description
        if data.icon is not None:
            group.icon = data.icon
        group = await self.repo.update_group(group)
        return await self._build_group_response(group)

    async def delete_group(self, group_id: uuid.UUID, user_id: uuid.UUID) -> None:
        group = await self.repo.get_group(group_id)
        if not group:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")
        await self._assert_admin(group_id, user_id)
        await self.repo.delete_group(group)

    # ── Members ─────────────────────────────────────────────
    async def add_member(
        self,
        group_id: uuid.UUID,
        user_id: uuid.UUID,
        data: AddMemberRequest,
    ) -> GroupResponse:
        await self._assert_admin(group_id, user_id)
        target = await self.repo.get_user_by_username(data.username)
        if not target:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
        existing = await self.repo.get_member(group_id, target.id)
        if existing:
            raise HTTPException(status.HTTP_409_CONFLICT, "Already a member")
        member = GroupMember(group_id=group_id, user_id=target.id, role="member")
        await self.repo.add_member(member)
        group = await self.repo.get_group(group_id)
        return await self._build_group_response(group)  # type: ignore

    async def remove_member(
        self,
        group_id: uuid.UUID,
        user_id: uuid.UUID,
        target_user_id: uuid.UUID,
    ) -> None:
        await self._assert_admin(group_id, user_id)
        if user_id == target_user_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot remove yourself")
        member = await self.repo.get_member(group_id, target_user_id)
        if not member:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
        await self.repo.remove_member(member)

    async def update_member_role(
        self,
        group_id: uuid.UUID,
        user_id: uuid.UUID,
        target_user_id: uuid.UUID,
        data: UpdateMemberRoleRequest,
    ) -> MemberInfo:
        await self._assert_admin(group_id, user_id)
        if data.role not in ("admin", "member"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid role")
        member = await self.repo.get_member(group_id, target_user_id)
        if not member:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
        member = await self.repo.update_member_role(member, data.role)
        target = await self.repo.get_user(target_user_id)
        return MemberInfo(
            id=member.id,
            user_id=member.user_id,
            username=target.username if target else "",
            email=target.email if target else "",
            role=member.role,
            joined_at=member.joined_at,
        )

    # ── Expenses ────────────────────────────────────────────
    async def create_expense(
        self,
        group_id: uuid.UUID,
        user_id: uuid.UUID,
        data: GroupExpenseCreate,
    ) -> GroupExpenseResponse:
        await self._assert_member(group_id, user_id)
        expense = GroupExpense(
            group_id=group_id,
            paid_by=user_id,
            amount=data.amount,
            description=data.description,
            date=data.date,
            split_type=data.split_type,
        )
        expense = await self.repo.create_expense(expense)

        members = await self.repo.list_members(group_id)
        if data.split_type == "custom" and data.splits:
            splits = [
                GroupExpenseSplit(
                    group_expense_id=expense.id,
                    user_id=s.user_id,
                    amount=s.amount,
                )
                for s in data.splits
            ]
        else:
            count = len(members)
            per_person = (data.amount / count).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            splits = [
                GroupExpenseSplit(
                    group_expense_id=expense.id,
                    user_id=m.user_id,
                    amount=per_person,
                )
                for m in members
            ]
        await self.repo.add_splits(splits)
        await self.db.commit()
        await self.db.refresh(expense)
        return await self._build_expense_response(expense)

    async def list_expenses(
        self, group_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[GroupExpenseResponse]:
        await self._assert_member(group_id, user_id)
        expenses = await self.repo.list_expenses(group_id)
        return [await self._build_expense_response(e) for e in expenses]

    async def delete_expense(
        self,
        group_id: uuid.UUID,
        expense_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        await self._assert_member(group_id, user_id)
        expense = await self.repo.get_expense(expense_id)
        if not expense or expense.group_id != group_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Expense not found")
        member = await self.repo.get_member(group_id, user_id)
        if expense.paid_by != user_id and (not member or member.role != "admin"):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed")
        await self.repo.delete_expense(expense)

    async def _build_expense_response(
        self, expense: GroupExpense
    ) -> GroupExpenseResponse:
        user_ids = [s.user_id for s in expense.splits] + [expense.paid_by]
        usernames = await self.repo.get_usernames(user_ids)
        split_responses = [
            SplitResponse(
                id=s.id,
                user_id=s.user_id,
                username=usernames.get(s.user_id, ""),
                amount=s.amount,
                is_settled=s.is_settled,
            )
            for s in expense.splits
        ]
        return GroupExpenseResponse(
            id=expense.id,
            group_id=expense.group_id,
            paid_by=expense.paid_by,
            paid_by_username=usernames.get(expense.paid_by, ""),
            amount=expense.amount,
            description=expense.description,
            date=expense.date,
            split_type=expense.split_type,
            created_at=expense.created_at,
            splits=split_responses,
        )

    # ── Settlements ─────────────────────────────────────────
    async def create_settlement(
        self,
        group_id: uuid.UUID,
        user_id: uuid.UUID,
        data: SettlementCreate,
    ) -> SettlementResponse:
        await self._assert_member(group_id, user_id)
        settlement = GroupSettlement(
            group_id=group_id,
            paid_by=user_id,
            paid_to=data.paid_to,
            amount=data.amount,
            date=data.date,
        )
        settlement = await self.repo.create_settlement(settlement)
        usernames = await self.repo.get_usernames([user_id, data.paid_to])
        return SettlementResponse(
            id=settlement.id,
            group_id=settlement.group_id,
            paid_by=settlement.paid_by,
            paid_by_username=usernames.get(settlement.paid_by, ""),
            paid_to=settlement.paid_to,
            paid_to_username=usernames.get(settlement.paid_to, ""),
            amount=settlement.amount,
            date=settlement.date,
            created_at=settlement.created_at,
        )

    async def list_settlements(
        self, group_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[SettlementResponse]:
        await self._assert_member(group_id, user_id)
        settlements = await self.repo.list_settlements(group_id)
        all_ids: set[uuid.UUID] = set()
        for s in settlements:
            all_ids.add(s.paid_by)
            all_ids.add(s.paid_to)
        usernames = await self.repo.get_usernames(list(all_ids))
        return [
            SettlementResponse(
                id=s.id,
                group_id=s.group_id,
                paid_by=s.paid_by,
                paid_by_username=usernames.get(s.paid_by, ""),
                paid_to=s.paid_to,
                paid_to_username=usernames.get(s.paid_to, ""),
                amount=s.amount,
                date=s.date,
                created_at=s.created_at,
            )
            for s in settlements
        ]

    async def delete_settlement(
        self,
        group_id: uuid.UUID,
        settlement_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        await self._assert_member(group_id, user_id)
        settlement = await self.repo.get_settlement(settlement_id)
        if not settlement or settlement.group_id != group_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Settlement not found")
        member = await self.repo.get_member(group_id, user_id)
        if settlement.paid_by != user_id and (not member or member.role != "admin"):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed")
        await self.repo.delete_settlement(settlement)

    # ── Balances ────────────────────────────────────────────
    async def get_balances(
        self, group_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[BalanceEntry]:
        await self._assert_member(group_id, user_id)
        balances = await self.repo.compute_balances(group_id)
        user_ids = list(balances.keys())
        usernames = await self.repo.get_usernames(user_ids)
        return [
            BalanceEntry(
                user_id=uid,
                username=usernames.get(uid, ""),
                balance=bal,
            )
            for uid, bal in balances.items()
        ]
