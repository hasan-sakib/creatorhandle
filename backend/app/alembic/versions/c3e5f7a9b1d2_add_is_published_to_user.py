"""Add is_published to user

Revision ID: c3e5f7a9b1d2
Revises: b7d2e4f6a8c1
Create Date: 2026-09-17 09:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c3e5f7a9b1d2"
down_revision = "b7d2e4f6a8c1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "user",
        sa.Column(
            "is_published", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
    )
    op.alter_column("user", "is_published", server_default=None)


def downgrade():
    op.drop_column("user", "is_published")
