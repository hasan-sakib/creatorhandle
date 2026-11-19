"""Workspaces and their memberships."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

from app.domain.permissions import MemberStatus, WorkspaceRole
from app.models.common import get_datetime_utc
from app.models.user import User

# ── Workspace ─────────────────────────────────────────────────────────────────


class WorkspaceBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(unique=True, index=True, max_length=60)
    logo_url: str | None = Field(default=None, max_length=2048)
    description: str | None = Field(default=None, max_length=300)
    timezone: str | None = Field(default=None, max_length=50)
    workspace_type: str | None = Field(default=None, max_length=20)


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    logo_url: str | None = Field(default=None, max_length=2048)
    description: str | None = Field(default=None, max_length=300)
    timezone: str | None = Field(default=None, max_length=50)
    workspace_type: str | None = Field(default=None, max_length=20)


class Workspace(WorkspaceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    members: list["WorkspaceMember"] = Relationship(
        back_populates="workspace", cascade_delete=True
    )


class WorkspacePublic(WorkspaceBase):
    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    role: str | None = None


class WorkspacesPublic(SQLModel):
    data: list[WorkspacePublic]
    count: int


# ── WorkspaceMember ───────────────────────────────────────────────────────────


class WorkspaceMemberBase(SQLModel):
    role: str = Field(default="member", max_length=20)
    status: str = Field(default="active", max_length=20)


class WorkspaceMemberUpdate(SQLModel):
    role: WorkspaceRole | None = None
    status: MemberStatus | None = None


class WorkspaceMember(WorkspaceMemberBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    workspace_id: uuid.UUID = Field(
        foreign_key="workspace.id", nullable=False, ondelete="CASCADE", index=True
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE", index=True
    )
    joined_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    workspace: Workspace | None = Relationship(back_populates="members")
    user: User | None = Relationship()

    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_workspace_user"),
    )


class WorkspaceMemberPublic(WorkspaceMemberBase):
    id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    joined_at: datetime | None = None
    full_name: str | None = None
    email: str | None = None
    avatar_url: str | None = None


class WorkspaceMembersPublic(SQLModel):
    data: list[WorkspaceMemberPublic]
    count: int
