"""add category_type to categories and transfer_to field to expenses

Revision ID: 012
Revises: 011
Create Date: 2026-04-09

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_INCOME_CATEGORIES = [
    ("Salary", "💰", "Monthly salary or wages"),
    ("Freelance", "💻", "Freelance or contract work"),
    ("Side Job", "🔨", "Part-time or gig work"),
    ("Investments", "📈", "Dividends, interest, capital gains"),
    ("Gifts", "🎁", "Money received as gifts"),
    ("Refund", "🔄", "Refunds and reimbursements"),
    ("Other Income", "💵", "Miscellaneous income"),
]


def upgrade() -> None:
    # Add category_type column to categories
    op.add_column(
        "categories",
        sa.Column(
            "category_type",
            sa.String(10),
            nullable=False,
            server_default="expense",
        ),
    )

    # Add transfer_to_payment_method_id to expenses
    op.add_column(
        "expenses",
        sa.Column(
            "transfer_to_payment_method_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("payment_methods.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # Seed default income categories
    categories_table = sa.table(
        "categories",
        sa.column("id", sa.dialects.postgresql.UUID),
        sa.column("name", sa.String),
        sa.column("emoji", sa.String),
        sa.column("description", sa.Text),
        sa.column("user_id", sa.dialects.postgresql.UUID),
        sa.column("category_type", sa.String),
    )
    for name, emoji, description in DEFAULT_INCOME_CATEGORIES:
        op.execute(
            categories_table.insert().values(
                id=sa.text("gen_random_uuid()"),
                name=name,
                emoji=emoji,
                description=description,
                user_id=None,
                category_type="income",
            )
        )


def downgrade() -> None:
    # Remove seeded income categories
    op.execute(
        "DELETE FROM categories WHERE category_type = 'income' AND user_id IS NULL"
    )
    op.drop_column("expenses", "transfer_to_payment_method_id")
    op.drop_column("categories", "category_type")
