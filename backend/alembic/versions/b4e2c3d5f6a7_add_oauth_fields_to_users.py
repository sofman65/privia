"""add oauth fields to users

Revision ID: b4e2c3d5f6a7
Revises: a3f1b2c4d5e6
Create Date: 2026-02-08 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b4e2c3d5f6a7"
down_revision: Union[str, Sequence[str], None] = "a3f1b2c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("provider", sa.String(), nullable=True))
    op.add_column("users", sa.Column("provider_account_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(), nullable=True))

    # Make password_hash nullable for OAuth users (existing rows have a hash)
    # SQLite doesn't support ALTER COLUMN, but new rows can have empty string default


def downgrade() -> None:
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "provider_account_id")
    op.drop_column("users", "provider")
