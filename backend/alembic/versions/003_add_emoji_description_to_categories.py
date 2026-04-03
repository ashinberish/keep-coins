"""add emoji and description to categories

Revision ID: 003
Revises: 002
Create Date: 2026-04-03

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

EMOJI_MAP = {
    "Food & Dining": "🍔",
    "Transportation": "🚗",
    "Shopping": "🛍️",
    "Entertainment": "🎬",
    "Bills & Utilities": "💡",
    "Health & Fitness": "💪",
    "Education": "📚",
    "Travel": "✈️",
    "Groceries": "🛒",
    "Other": "📦",
}

DESCRIPTION_MAP = {
    "Food & Dining": "Restaurants, cafés, takeout",
    "Transportation": "Gas, public transit, rideshares",
    "Shopping": "Clothing, electronics, online orders",
    "Entertainment": "Movies, games, streaming",
    "Bills & Utilities": "Rent, electricity, internet, phone",
    "Health & Fitness": "Gym, medicine, doctor visits",
    "Education": "Courses, books, tuition",
    "Travel": "Flights, hotels, vacation expenses",
    "Groceries": "Supermarket, household supplies",
    "Other": "Miscellaneous expenses",
}


def upgrade() -> None:
    op.add_column("categories", sa.Column("emoji", sa.String(10), nullable=True))
    op.add_column("categories", sa.Column("description", sa.Text, nullable=True))

    # Update default categories with emojis and descriptions
    for name, emoji in EMOJI_MAP.items():
        desc = DESCRIPTION_MAP.get(name)
        op.execute(
            sa.text(
                "UPDATE categories SET emoji = :emoji, description = :desc WHERE name = :name AND user_id IS NULL"
            ).bindparams(emoji=emoji, desc=desc, name=name)
        )

    # Set fallback for any remaining rows
    op.execute(sa.text("UPDATE categories SET emoji = '📁' WHERE emoji IS NULL"))

    op.alter_column("categories", "emoji", nullable=False, server_default="📁")


def downgrade() -> None:
    op.drop_column("categories", "description")
    op.drop_column("categories", "emoji")
