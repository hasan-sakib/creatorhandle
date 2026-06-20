"""Add workspace tables (brand, project, task)

Revision ID: 3a9f1c2d4e5b
Revises: fe56fa70289e
Create Date: 2026-06-20 10:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = "3a9f1c2d4e5b"
down_revision = "fe56fa70289e"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "brand",
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column("category", sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column("contact_name", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
        sa.Column("contact_email", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column("status", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column("notes", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "project",
        sa.Column("title", sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
        sa.Column("type", sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column("platform_status", sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column("deadline", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column("brand_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["brand_id"], ["brand.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "task",
        sa.Column("title", sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column("status", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column("priority", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column("due_date", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
        sa.Column("project_id", sa.Uuid(), nullable=True),
        sa.Column("assigned_to", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["assigned_to"], ["user.id"]),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("task")
    op.drop_table("project")
    op.drop_table("brand")
