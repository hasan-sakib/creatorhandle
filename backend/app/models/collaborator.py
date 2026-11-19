"""Named collaborators tasks can be assigned to."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.models.common import get_datetime_utc
from app.models.user import User

if TYPE_CHECKING:
    from app.models.task import Task


# ── Collaborator ──────────────────────────────────────────────────────────────


class CollaboratorBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    role: str = Field(max_length=50)


class CollaboratorCreate(CollaboratorBase):
    pass


class CollaboratorUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=100)
    role: str | None = Field(default=None, max_length=50)


class Collaborator(CollaboratorBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    workspace_id: uuid.UUID = Field(
        foreign_key="workspace.id", nullable=False, ondelete="CASCADE", index=True
    )
    owner: User | None = Relationship()
    tasks: list["Task"] = Relationship(back_populates="collaborator")


class CollaboratorPublic(CollaboratorBase):
    id: uuid.UUID
    workspace_id: uuid.UUID


class CollaboratorsPublic(SQLModel):
    data: list[CollaboratorPublic]
    count: int
