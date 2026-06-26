"""add avatar_url to user

Revision ID: 9a1b2c3d4e5f
Revises: 8f5e6d7c8a9b
Create Date: 2026-06-26

"""
from alembic import op
import sqlalchemy as sa

revision = "9a1b2c3d4e5f"
down_revision = "8f5e6d7c8a9b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user", sa.Column("avatar_url", sa.String(length=2048), nullable=True))


def downgrade() -> None:
    op.drop_column("user", "avatar_url")
