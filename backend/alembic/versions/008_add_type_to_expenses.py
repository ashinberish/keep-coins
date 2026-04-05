"""add type column to expenses

Revision ID: 008
Revises: 007
Create Date: 2026-04-06

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "expenses",
        sa.Column(
            "type",
            sa.String(7),
            nullable=False,
            server_default="expense",
        ),
    )


def downgrade() -> None:
    op.drop_column("expenses", "type")
