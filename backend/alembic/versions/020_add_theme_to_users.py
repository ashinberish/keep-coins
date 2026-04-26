"""add theme to users

Revision ID: 020
Revises: 019
Create Date: 2026-04-26

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "020"
down_revision: Union[str, None] = "019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "theme",
            sa.String(10),
            server_default="system",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "theme")
