"""make hashed_password nullable

Revision ID: 5c8e2f1a9b3d
Revises: 4b7c2d3e9f1a
Create Date: 2026-06-20

"""
from alembic import op

revision = "5c8e2f1a9b3d"
down_revision = "4b7c2d3e9f1a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("user", "hashed_password", nullable=True)


def downgrade() -> None:
    op.alter_column("user", "hashed_password", nullable=False)
