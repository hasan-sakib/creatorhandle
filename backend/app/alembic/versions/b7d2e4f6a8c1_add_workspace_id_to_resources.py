"""Add workspace_id to brand/project/task/collaborator and backfill personal workspaces

Revision ID: b7d2e4f6a8c1
Revises: a1c9d3e7f2b4
Create Date: 2026-09-15 09:05:00.000000

"""
import re
import uuid

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b7d2e4f6a8c1"
down_revision = "a1c9d3e7f2b4"
branch_labels = None
depends_on = None

RESOURCE_TABLES = ("brand", "project", "task", "collaborator")


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "workspace"


def upgrade():
    bind = op.get_bind()

    # 1. Add nullable workspace_id columns first (backfilled below, then locked NOT NULL)
    for table in RESOURCE_TABLES:
        op.add_column(table, sa.Column("workspace_id", sa.Uuid(), nullable=True))
        op.create_foreign_key(
            f"fk_{table}_workspace_id_workspace",
            table,
            "workspace",
            ["workspace_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # 2. Backfill: every existing user gets a personal workspace + owner membership,
    #    and their existing resources are assigned to it.
    users = bind.execute(sa.text('SELECT id, email, full_name FROM "user"')).fetchall()
    now = sa.func.now()

    for user_id, email, full_name in users:
        base = _slugify(full_name or email.split("@")[0])
        slug = f"{base}-{uuid.uuid4().hex[:6]}"
        name = f"{full_name or email}'s Workspace"
        workspace_id = uuid.uuid4()

        bind.execute(
            sa.text(
                'INSERT INTO workspace (id, name, slug, created_at, updated_at) '
                "VALUES (:id, :name, :slug, now(), now())"
            ),
            {"id": workspace_id, "name": name, "slug": slug},
        )
        bind.execute(
            sa.text(
                "INSERT INTO workspacemember (id, workspace_id, user_id, role, status, joined_at) "
                "VALUES (:id, :workspace_id, :user_id, 'owner', 'active', now())"
            ),
            {"id": uuid.uuid4(), "workspace_id": workspace_id, "user_id": user_id},
        )

        for table in RESOURCE_TABLES:
            bind.execute(
                sa.text(
                    f'UPDATE "{table}" SET workspace_id = :workspace_id WHERE owner_id = :user_id'
                ),
                {"workspace_id": workspace_id, "user_id": user_id},
            )

    # 3. Lock down: NOT NULL + index now that every row has a workspace_id.
    for table in RESOURCE_TABLES:
        op.alter_column(table, "workspace_id", nullable=False)
        op.create_index(
            op.f(f"ix_{table}_workspace_id"), table, ["workspace_id"]
        )


def downgrade():
    for table in RESOURCE_TABLES:
        op.drop_index(op.f(f"ix_{table}_workspace_id"), table_name=table)
        op.drop_constraint(
            f"fk_{table}_workspace_id_workspace", table, type_="foreignkey"
        )
        op.drop_column(table, "workspace_id")
