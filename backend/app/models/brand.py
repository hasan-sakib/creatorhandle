"""Brands a workspace works with."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.models.common import get_datetime_utc
from app.models.user import User

if TYPE_CHECKING:
    from app.models.project import Project


# ── Brand ────────────────────────────────────────────────────────────────────


class BrandBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(default="Other", max_length=50)
    contact_name: str | None = Field(default=None, max_length=100)
    contact_email: str | None = Field(default=None, max_length=255)
    status: str = Field(default="active", max_length=20)
    notes: str | None = Field(default=None, max_length=500)


class BrandCreate(BrandBase):
    pass


class BrandUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    category: str | None = Field(default=None, max_length=50)
    contact_name: str | None = Field(default=None, max_length=100)
    contact_email: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default=None, max_length=20)
    notes: str | None = Field(default=None, max_length=500)


class Brand(BrandBase, table=True):
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
    projects: list["Project"] = Relationship(
        back_populates="brand", cascade_delete=True
    )


class BrandPublic(BrandBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    workspace_id: uuid.UUID
    created_at: datetime | None = None


class BrandsPublic(SQLModel):
    data: list[BrandPublic]
    count: int
