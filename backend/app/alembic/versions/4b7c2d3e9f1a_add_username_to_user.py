"""Add username to user table

Revision ID: 4b7c2d3e9f1a
Revises: 3a9f1c2d4e5b
Create Date: 2026-06-20 12:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

revision = "4b7c2d3e9f1a"
down_revision = "3a9f1c2d4e5b"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "user",
        sa.Column("username", sqlmodel.sql.sqltypes.AutoString(length=30), nullable=True),
    )
    op.create_unique_constraint("uq_user_username", "user", ["username"])


def downgrade():
    op.drop_constraint("uq_user_username", "user", type_="unique")
    op.drop_column("user", "username")
