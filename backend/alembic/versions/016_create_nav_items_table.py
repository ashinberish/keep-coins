"""create app_config table

Revision ID: 016
Revises: 015
Create Date: 2026-04-09

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_CONFIG = [
    ("feature.transactions", "true", "Enable Transactions page"),
    ("feature.accounts", "true", "Enable Accounts page"),
    ("feature.summary", "true", "Enable Summary page"),
    ("feature.emis", "true", "Enable EMIs page"),
]


def upgrade() -> None:
    tbl = op.create_table(
        "app_config",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("key", sa.String(100), nullable=False, unique=True),
        sa.Column("value", sa.String(255), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
    )
    op.bulk_insert(
        tbl,
        [
            {"key": key, "value": value, "description": desc}
            for key, value, desc in DEFAULT_CONFIG
        ],
    )


def downgrade() -> None:
    op.drop_table("app_config")
