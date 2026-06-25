"""add contact_email to user, is_featured to project

Revision ID: 8f5e6d7c8a9b
Revises: 7e4b5c1d2f3a
Create Date: 2026-06-24 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "8f5e6d7c8a9b"
down_revision = "7e4b5c1d2f3a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user", sa.Column("contact_email", sa.String(length=255), nullable=True))
    op.add_column("project", sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column("project", "is_featured")
    op.drop_column("user", "contact_email")
