"""Add portfolio fields to user and project

Revision ID: d4f6a8b0c2e3
Revises: c3e5f7a9b1d2
Create Date: 2026-10-13 09:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d4f6a8b0c2e3"
down_revision = "c3e5f7a9b1d2"
branch_labels = None
depends_on = None

USER_STRINGS = [
    ("headline", 120),
    ("location", 100),
    ("about", 2000),
    ("availability", 10),
    ("media_kit_url", 2048),
    ("cover_image_url", 2048),
    ("accent_color", 20),
]
USER_LISTS = ["languages", "niches", "content_formats", "platforms", "services"]


def _json_list_column(name: str) -> sa.Column:
    # NOT NULL with a '[]' default kept in the DB, so existing rows are valid
    # (Postgres adds this without rewriting the table).
    return sa.Column(
        name,
        postgresql.JSONB(),
        nullable=False,
        server_default=sa.text("'[]'::jsonb"),
    )


def upgrade():
    for name, length in USER_STRINGS:
        op.add_column(
            "user",
            sa.Column(
                name, sqlmodel.sql.sqltypes.AutoString(length=length), nullable=True
            ),
        )
    for name in USER_LISTS:
        op.add_column("user", _json_list_column(name))

    op.add_column(
        "project",
        sa.Column(
            "live_url", sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True
        ),
    )
    op.add_column(
        "project",
        sa.Column(
            "thumbnail_url",
            sqlmodel.sql.sqltypes.AutoString(length=2048),
            nullable=True,
        ),
    )
    op.add_column("project", _json_list_column("tags"))


def downgrade():
    op.drop_column("project", "tags")
    op.drop_column("project", "thumbnail_url")
    op.drop_column("project", "live_url")
    for name in reversed(USER_LISTS):
        op.drop_column("user", name)
    for name, _ in reversed(USER_STRINGS):
        op.drop_column("user", name)
