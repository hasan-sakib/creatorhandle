"""Add collaborators table and task.collaborator_id

Revision ID: 7e4b5c1d2f3a
Revises: 6d9a3f2e1c8b
Create Date: 2026-06-23 01:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "7e4b5c1d2f3a"
down_revision = "6d9a3f2e1c8b"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "collaborator",
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column("role", sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column("id", UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("owner_id", UUID(as_uuid=False), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.add_column(
        "task",
        sa.Column(
            "collaborator_id",
            UUID(as_uuid=False),
            sa.ForeignKey("collaborator.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade():
    op.drop_column("task", "collaborator_id")
    op.drop_table("collaborator")
