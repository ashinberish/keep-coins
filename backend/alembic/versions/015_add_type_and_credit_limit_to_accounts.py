"""add type and credit_limit to accounts

Revision ID: 015
Revises: 014
Create Date: 2026-04-09

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column(
            "type",
            sa.String(20),
            nullable=False,
            server_default="bank",
        ),
    )
    op.add_column(
        "accounts",
        sa.Column(
            "credit_limit",
            sa.Numeric(precision=12, scale=2),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("accounts", "credit_limit")
    op.drop_column("accounts", "type")
