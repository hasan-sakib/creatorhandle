"""Add bio and social links to user table

Revision ID: 6d9a3f2e1c8b
Revises: 5c8e2f1a9b3d
Create Date: 2026-06-23 00:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

revision = "6d9a3f2e1c8b"
down_revision = "5c8e2f1a9b3d"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("user", sa.Column("bio", sqlmodel.sql.sqltypes.AutoString(length=300), nullable=True))
    op.add_column("user", sa.Column("website", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True))
    op.add_column("user", sa.Column("twitter", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.add_column("user", sa.Column("instagram", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.add_column("user", sa.Column("youtube", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.add_column("user", sa.Column("tiktok", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))


def downgrade():
    op.drop_column("user", "tiktok")
    op.drop_column("user", "youtube")
    op.drop_column("user", "instagram")
    op.drop_column("user", "twitter")
    op.drop_column("user", "website")
    op.drop_column("user", "bio")
