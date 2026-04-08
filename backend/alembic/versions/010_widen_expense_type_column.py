"""widen expense type column to support transfer

Revision ID: 010
Revises: 009
Create Date: 2026-04-09

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "expenses",
        "type",
        type_=sa.String(10),
        existing_type=sa.String(7),
        existing_nullable=False,
        existing_server_default="expense",
    )


def downgrade() -> None:
    op.alter_column(
        "expenses",
        "type",
        type_=sa.String(7),
        existing_type=sa.String(10),
        existing_nullable=False,
        existing_server_default="expense",
    )
