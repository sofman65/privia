"""add conversation status column and partial unique index

Revision ID: a3f1b2c4d5e6
Revises: 2e6c151298f6
Create Date: 2026-02-08 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a3f1b2c4d5e6"
down_revision: Union[str, Sequence[str], None] = "2e6c151298f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add status column (default "active" for existing rows since they already have messages)
    op.add_column(
        "conversations",
        sa.Column("status", sa.String(), nullable=False, server_default="active"),
    )

    # Layer 4: partial unique index — at most one "empty" conversation per user.
    # SQLite supports partial indexes natively.
    op.execute(
        "CREATE UNIQUE INDEX ix_conversations_one_empty_per_user "
        "ON conversations (user_id) WHERE status = 'empty'"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_conversations_one_empty_per_user")
    op.drop_column("conversations", "status")
