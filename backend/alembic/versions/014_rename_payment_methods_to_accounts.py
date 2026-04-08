"""rename payment_methods to accounts throughout

Revision ID: 014
Revises: 013
Create Date: 2026-04-09

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename table
    op.rename_table("payment_methods", "accounts")

    # Rename columns in expenses
    op.alter_column("expenses", "payment_method_id", new_column_name="account_id")
    op.alter_column(
        "expenses",
        "transfer_to_payment_method_id",
        new_column_name="transfer_to_account_id",
    )

    # Rename column in users
    op.alter_column(
        "users", "default_payment_method_id", new_column_name="default_account_id"
    )


def downgrade() -> None:
    op.alter_column(
        "users", "default_account_id", new_column_name="default_payment_method_id"
    )
    op.alter_column(
        "expenses",
        "transfer_to_account_id",
        new_column_name="transfer_to_payment_method_id",
    )
    op.alter_column("expenses", "account_id", new_column_name="payment_method_id")
    op.rename_table("accounts", "payment_methods")
