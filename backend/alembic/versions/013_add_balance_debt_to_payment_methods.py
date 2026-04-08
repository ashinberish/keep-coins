"""add balance and debt columns to payment_methods

Revision ID: 013
Revises: 012
Create Date: 2026-04-10

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "payment_methods",
        sa.Column(
            "balance",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "payment_methods",
        sa.Column(
            "debt",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
            server_default="0",
        ),
    )


def downgrade() -> None:
    op.drop_column("payment_methods", "debt")
    op.drop_column("payment_methods", "balance")
