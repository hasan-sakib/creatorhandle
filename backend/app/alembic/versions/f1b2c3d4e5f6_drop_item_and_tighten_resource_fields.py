"""Drop the template item table; fixed choices and real dates on resources

Revision ID: f1b2c3d4e5f6
Revises: e5a7b9c1d3f4
Create Date: 2026-11-21 12:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = "f1b2c3d4e5f6"
down_revision = "e5a7b9c1d3f4"
branch_labels = None
depends_on = None

# (table, column, allowed values, fallback for anything else)
CHOICES = [
    ("task", "status", ["To Do", "In Progress", "Done"], "To Do"),
    ("task", "priority", ["Low", "Medium", "High"], "Medium"),
    (
        "project",
        "type",
        ["YouTube", "TikTok", "Instagram", "Twitch", "Blog", "Other"],
        "Other",
    ),
    (
        "project",
        "platform_status",
        ["Planning", "In Progress", "Review", "Published", "Cancelled"],
        "Planning",
    ),
    ("brand", "status", ["active", "inactive"], "active"),
]

DATES = [("project", "deadline"), ("task", "due_date")]


def upgrade():
    op.drop_table("item")

    # Values outside the allowed set would fail response validation; map them
    # to the default (the dashboard never offered anything else).
    for table, column, allowed, fallback in CHOICES:
        op.execute(
            sa.text(
                f'UPDATE "{table}" SET "{column}" = :fallback '
                f'WHERE "{column}" IS NULL OR "{column}" NOT IN :allowed'
            ).bindparams(
                sa.bindparam("allowed", expanding=True),
                fallback=fallback,
                allowed=allowed,
            )
        )

    # ISO strings become DATE; anything unparsable becomes NULL instead of
    # aborting the migration.
    op.execute(
        """
        CREATE FUNCTION pg_temp.safe_date(value text) RETURNS date AS $$
        BEGIN
            RETURN NULLIF(trim(value), '')::date;
        EXCEPTION WHEN others THEN
            RETURN NULL;
        END
        $$ LANGUAGE plpgsql
        """
    )
    for table, column in DATES:
        op.alter_column(
            table,
            column,
            type_=sa.Date(),
            existing_type=sqlmodel.sql.sqltypes.AutoString(length=20),
            existing_nullable=True,
            postgresql_using=f"pg_temp.safe_date({column})",
        )


def downgrade():
    for table, column in DATES:
        op.alter_column(
            table,
            column,
            type_=sqlmodel.sql.sqltypes.AutoString(length=20),
            existing_type=sa.Date(),
            existing_nullable=True,
            postgresql_using=f"to_char({column}, 'YYYY-MM-DD')",
        )

    op.create_table(
        "item",
        sa.Column("title", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column(
            "description", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
