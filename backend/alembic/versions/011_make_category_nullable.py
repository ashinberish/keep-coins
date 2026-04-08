"""make category_id nullable for income and transfer

Revision ID: 011
Revises: 010
Create Date: 2026-04-09

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing FK (RESTRICT), make nullable, re-add FK (SET NULL)
    op.drop_constraint("expenses_category_id_fkey", "expenses", type_="foreignkey")
    op.alter_column("expenses", "category_id", nullable=True)
    op.create_foreign_key(
        "expenses_category_id_fkey",
        "expenses",
        "categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("expenses_category_id_fkey", "expenses", type_="foreignkey")
    op.alter_column("expenses", "category_id", nullable=False)
    op.create_foreign_key(
        "expenses_category_id_fkey",
        "expenses",
        "categories",
        ["category_id"],
        ["id"],
        ondelete="RESTRICT",
    )
