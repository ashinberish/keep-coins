"""add sidebar button config

Revision ID: 023
Revises: 022
Create Date: 2026-04-30

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "023"
down_revision: Union[str, None] = "022"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CONFIGS = [
    ("sidebar_button.enabled", "false", "Show sidebar button"),
    ("sidebar_button.label", "Give Feedback", "Button text"),
    ("sidebar_button.url", "", "Button link URL"),
    ("sidebar_button.variant", "outline", "Style: outline, default, or secondary"),
]


def upgrade() -> None:
    for key, value, desc in CONFIGS:
        op.execute(
            f"INSERT INTO app_config (key, value, description) "
            f"VALUES ('{key}', '{value}', '{desc}')"
        )


def downgrade() -> None:
    op.execute("DELETE FROM app_config WHERE key LIKE 'sidebar_button.%'")
