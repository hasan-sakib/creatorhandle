"""Projects (optionally for a brand), shown on the public portfolio."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import Field as PydanticField
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.domain.validators import (
    image_url as clean_image_url,
    tag_list,
    url as clean_url,
)
from app.models.brand import Brand
from app.models.common import get_datetime_utc, json_list_field
from app.models.user import User

if TYPE_CHECKING:
    from app.models.task import Task


# ── Project ───────────────────────────────────────────────────────────────────


class ProjectBase(SQLModel):
    title: str = Field(min_length=1, max_length=200)
    type: str = Field(default="Other", max_length=50)
    platform_status: str = Field(default="Planning", max_length=50)
    deadline: str | None = Field(default=None, max_length=20)  # ISO date string
    description: str | None = Field(default=None, max_length=500)
    brand_id: uuid.UUID | None = Field(
        default=None, foreign_key="brand.id", nullable=True, ondelete="CASCADE"
    )
    is_featured: bool = Field(default=False)
    # Portfolio details for the public page
    live_url: str | None = Field(default=None, max_length=2048)
    thumbnail_url: str | None = Field(default=None, max_length=2048)
    tags: list[str] = json_list_field()


class ProjectCreate(ProjectBase):
    live_url: clean_url() = None  # type: ignore[valid-type]
    thumbnail_url: clean_image_url() = None  # type: ignore[valid-type]
    tags: tag_list(6) = PydanticField(default_factory=list)  # type: ignore[valid-type]


class ProjectUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    type: str | None = Field(default=None, max_length=50)
    platform_status: str | None = Field(default=None, max_length=50)
    deadline: str | None = Field(default=None, max_length=20)
    description: str | None = Field(default=None, max_length=500)
    brand_id: uuid.UUID | None = None
    is_featured: bool | None = None
    live_url: clean_url() = None  # type: ignore[valid-type]
    thumbnail_url: clean_image_url() = None  # type: ignore[valid-type]
    tags: tag_list(6) = PydanticField(default_factory=list)  # type: ignore[valid-type]


class Project(ProjectBase, table=True):
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
    brand: Brand | None = Relationship(back_populates="projects")
    tasks: list["Task"] = Relationship(back_populates="project", cascade_delete=True)


class ProjectPublic(ProjectBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    workspace_id: uuid.UUID
    created_at: datetime | None = None


class ProjectsPublic(SQLModel):
    data: list[ProjectPublic]
    count: int
