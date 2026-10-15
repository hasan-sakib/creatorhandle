"""Add portfolio theme, color mode and work style to user

Revision ID: e5a7b9c1d3f4
Revises: d4f6a8b0c2e3
Create Date: 2026-10-15 12:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "e5a7b9c1d3f4"
down_revision = "d4f6a8b0c2e3"
branch_labels = None
depends_on = None

USER_STRINGS = [("theme", 20), ("color_mode", 10)]
USER_LISTS = ["work_steps", "work_principles", "work_tools"]


def upgrade():
    # NULL theme / color_mode means "use the platform default", so existing
    # profiles keep their current look and no backfill is needed.
    for name, length in USER_STRINGS:
        op.add_column(
            "user",
            sa.Column(
                name, sqlmodel.sql.sqltypes.AutoString(length=length), nullable=True
            ),
        )
    for name in USER_LISTS:
        op.add_column(
            "user",
            sa.Column(
                name,
                postgresql.JSONB(),
                nullable=False,
                server_default=sa.text("'[]'::jsonb"),
            ),
        )


def downgrade():
    for name in reversed(USER_LISTS):
        op.drop_column("user", name)
    for name, _ in reversed(USER_STRINGS):
        op.drop_column("user", name)
