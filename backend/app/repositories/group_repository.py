import uuid
from collections import defaultdict
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.group import (
    Group,
    GroupExpense,
    GroupExpenseSplit,
    GroupMember,
    GroupSettlement,
)
from app.models.user import User


class GroupRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Groups ───────────────────────────────────────────────
    async def create_group(self, group: Group) -> Group:
        self.db.add(group)
        await self.db.commit()
        await self.db.refresh(group)
        return group

    async def get_group(self, group_id: uuid.UUID) -> Group | None:
        result = await self.db.execute(select(Group).where(Group.id == group_id))
        return result.scalar_one_or_none()

    async def list_groups_for_user(self, user_id: uuid.UUID) -> list[Group]:
        result = await self.db.execute(
            select(Group)
            .join(GroupMember, GroupMember.group_id == Group.id)
            .where(GroupMember.user_id == user_id)
            .order_by(Group.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def update_group(self, group: Group) -> Group:
        await self.db.commit()
        await self.db.refresh(group)
        return group

    async def delete_group(self, group: Group) -> None:
        await self.db.delete(group)
        await self.db.commit()

    # ── Members ──────────────────────────────────────────────
    async def add_member(self, member: GroupMember) -> GroupMember:
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def get_member(
        self, group_id: uuid.UUID, user_id: uuid.UUID
    ) -> GroupMember | None:
        result = await self.db.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_members(self, group_id: uuid.UUID) -> list[GroupMember]:
        result = await self.db.execute(
            select(GroupMember).where(GroupMember.group_id == group_id)
        )
        return list(result.scalars().all())

    async def remove_member(self, member: GroupMember) -> None:
        await self.db.delete(member)
        await self.db.commit()

    async def update_member_role(self, member: GroupMember, role: str) -> GroupMember:
        member.role = role
        await self.db.commit()
        await self.db.refresh(member)
        return member

    # ── Expenses ─────────────────────────────────────────────
    async def create_expense(self, expense: GroupExpense) -> GroupExpense:
        self.db.add(expense)
        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    async def get_expense(self, expense_id: uuid.UUID) -> GroupExpense | None:
        result = await self.db.execute(
            select(GroupExpense).where(GroupExpense.id == expense_id)
        )
        return result.scalar_one_or_none()

    async def list_expenses(self, group_id: uuid.UUID) -> list[GroupExpense]:
        result = await self.db.execute(
            select(GroupExpense)
            .where(GroupExpense.group_id == group_id)
            .order_by(GroupExpense.date.desc(), GroupExpense.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def delete_expense(self, expense: GroupExpense) -> None:
        await self.db.delete(expense)
        await self.db.commit()

    async def delete_splits(self, expense_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(GroupExpenseSplit).where(
                GroupExpenseSplit.group_expense_id == expense_id
            )
        )

    async def add_splits(self, splits: list[GroupExpenseSplit]) -> None:
        self.db.add_all(splits)
        await self.db.flush()

    # ── Settlements ──────────────────────────────────────────
    async def create_settlement(self, settlement: GroupSettlement) -> GroupSettlement:
        self.db.add(settlement)
        await self.db.commit()
        await self.db.refresh(settlement)
        return settlement

    async def list_settlements(self, group_id: uuid.UUID) -> list[GroupSettlement]:
        result = await self.db.execute(
            select(GroupSettlement)
            .where(GroupSettlement.group_id == group_id)
            .order_by(GroupSettlement.date.desc(), GroupSettlement.created_at.desc())
        )
        return list(result.scalars().all())

    async def delete_settlement(self, settlement: GroupSettlement) -> None:
        await self.db.delete(settlement)
        await self.db.commit()

    async def get_settlement(self, settlement_id: uuid.UUID) -> GroupSettlement | None:
        result = await self.db.execute(
            select(GroupSettlement).where(GroupSettlement.id == settlement_id)
        )
        return result.scalar_one_or_none()

    # ── Balances ─────────────────────────────────────────────
    async def compute_balances(self, group_id: uuid.UUID) -> dict[uuid.UUID, Decimal]:
        """
        Returns {user_id: net_balance}.
        Positive = owed money, Negative = owes money.
        """
        balances: dict[uuid.UUID, Decimal] = defaultdict(Decimal)

        expenses = await self.list_expenses(group_id)
        for exp in expenses:
            balances[exp.paid_by] += exp.amount
            for split in exp.splits:
                balances[split.user_id] -= split.amount

        settlements = await self.list_settlements(group_id)
        for s in settlements:
            balances[s.paid_by] -= s.amount
            balances[s.paid_to] += s.amount

        return dict(balances)

    # ── Helpers ──────────────────────────────────────────────
    async def get_user(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_username(self, username: str) -> User | None:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_usernames(self, user_ids: list[uuid.UUID]) -> dict[uuid.UUID, str]:
        if not user_ids:
            return {}
        result = await self.db.execute(
            select(User.id, User.username).where(User.id.in_(user_ids))
        )
        return {row.id: row.username for row in result.all()}
