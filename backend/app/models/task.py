"""Tasks within a workspace, optionally linked to a project/collaborator."""

import uuid
from datetime import date, datetime
from typing import Literal

from sqlalchemy import DateTime
from sqlmodel import AutoString, Field, Relationship, SQLModel

from app.models.collaborator import Collaborator, CollaboratorPublic
from app.models.common import get_datetime_utc
from app.models.project import Project
from app.models.user import User

# ── Task ──────────────────────────────────────────────────────────────────────

TaskStatus = Literal["To Do", "In Progress", "Done"]
TaskPriority = Literal["Low", "Medium", "High"]


class TaskBase(SQLModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    status: TaskStatus = Field(default="To Do", sa_type=AutoString(length=20))  # type: ignore[call-overload]
    priority: TaskPriority = Field(default="Medium", sa_type=AutoString(length=20))  # type: ignore[call-overload]
    due_date: date | None = Field(default=None)
    project_id: uuid.UUID | None = Field(
        default=None, foreign_key="project.id", nullable=True, ondelete="CASCADE"
    )
    assigned_to: uuid.UUID | None = Field(
        default=None, foreign_key="user.id", nullable=True
    )
    collaborator_id: uuid.UUID | None = Field(
        default=None, foreign_key="collaborator.id", nullable=True, ondelete="SET NULL"
    )


class TaskCreate(TaskBase):
    pass


class TaskUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None
    project_id: uuid.UUID | None = None
    assigned_to: uuid.UUID | None = None
    collaborator_id: uuid.UUID | None = None


class Task(TaskBase, table=True):
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
    owner: User | None = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Task.owner_id]"}
    )
    project: Project | None = Relationship(back_populates="tasks")
    collaborator: Collaborator | None = Relationship(back_populates="tasks")


class TaskPublic(TaskBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    workspace_id: uuid.UUID
    created_at: datetime | None = None
    collaborator: CollaboratorPublic | None = None


class TasksPublic(SQLModel):
    data: list[TaskPublic]
    count: int
