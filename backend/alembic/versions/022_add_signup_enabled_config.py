"""add signup.enabled config

Revision ID: 022
Revises: 021
Create Date: 2026-04-30

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "022"
down_revision: Union[str, None] = "021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "INSERT INTO app_config (key, value, description) "
        "VALUES ('signup.enabled', 'false', 'Allow new user registrations')"
    )


def downgrade() -> None:
    op.execute("DELETE FROM app_config WHERE key = 'signup.enabled'")
