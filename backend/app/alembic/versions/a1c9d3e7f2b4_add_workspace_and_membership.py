"""Add workspace and workspacemember tables

Revision ID: a1c9d3e7f2b4
Revises: 9a1b2c3d4e5f
Create Date: 2026-09-15 09:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1c9d3e7f2b4"
down_revision = "9a1b2c3d4e5f"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "workspace",
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column("slug", sqlmodel.sql.sqltypes.AutoString(length=60), nullable=False),
        sa.Column("logo_url", sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True),
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(length=300), nullable=True),
        sa.Column("timezone", sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
        sa.Column("workspace_type", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_workspace_slug"), "workspace", ["slug"], unique=True)

    op.create_table(
        "workspacemember",
        sa.Column("role", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column("status", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspace.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "user_id", name="uq_workspace_user"),
    )
    op.create_index(
        op.f("ix_workspacemember_workspace_id"), "workspacemember", ["workspace_id"]
    )
    op.create_index(
        op.f("ix_workspacemember_user_id"), "workspacemember", ["user_id"]
    )


def downgrade():
    op.drop_table("workspacemember")
    op.drop_index(op.f("ix_workspace_slug"), table_name="workspace")
    op.drop_table("workspace")
