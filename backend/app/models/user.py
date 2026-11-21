"""Users and their public profile/portfolio fields."""

import uuid
from datetime import datetime
from typing import Annotated, Any

from pydantic import EmailStr, Field as PydanticField
from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel

from app.domain.validators import (
    AccentKey,
    Availability,
    ColorMode,
    PlatformList,
    ServiceList,
    ThemeKey,
    WorkStepList,
    image_url as clean_image_url,
    tag_list,
    text as clean_text,
    url as clean_url,
)
from app.models.common import get_datetime_utc, json_list_field


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, max_length=30, unique=True)
    bio: str | None = Field(default=None, max_length=300)
    website: str | None = Field(default=None, max_length=255)
    twitter: str | None = Field(default=None, max_length=100)
    instagram: str | None = Field(default=None, max_length=100)
    youtube: str | None = Field(default=None, max_length=100)
    tiktok: str | None = Field(default=None, max_length=100)
    contact_email: str | None = Field(default=None, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=2048)
    is_published: bool = False

    # Portfolio details shown on the public page (/@username)
    headline: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=100)
    languages: list[str] = json_list_field()
    about: str | None = Field(default=None, max_length=2000)
    niches: list[str] = json_list_field()
    content_formats: list[str] = json_list_field()
    platforms: list[str] = json_list_field()
    services: list[dict[str, Any]] = json_list_field()
    availability: str | None = Field(default=None, max_length=10)
    media_kit_url: str | None = Field(default=None, max_length=2048)
    cover_image_url: str | None = Field(default=None, max_length=2048)
    accent_color: str | None = Field(default=None, max_length=20)
    # Look of the page and the "work style" content (see validators.py)
    theme: str | None = Field(default=None, max_length=20)
    color_mode: str | None = Field(default=None, max_length=10)
    work_steps: list[dict[str, Any]] = json_list_field()
    work_principles: list[str] = json_list_field()
    work_tools: list[str] = json_list_field()


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    # Profiles live at /@{username}, so keep usernames URL-safe.
    username: Annotated[
        str | None, PydanticField(max_length=30, pattern=r"^[A-Za-z0-9_-]+$")
    ] = None
    bio: str | None = Field(default=None, max_length=300)
    website: clean_url(255) = None  # type: ignore[valid-type]
    twitter: str | None = Field(default=None, max_length=100)
    instagram: str | None = Field(default=None, max_length=100)
    youtube: str | None = Field(default=None, max_length=100)
    tiktok: str | None = Field(default=None, max_length=100)
    contact_email: str | None = Field(default=None, max_length=255)
    avatar_url: clean_image_url() = None  # type: ignore[valid-type]
    is_published: bool | None = None

    # Portfolio details. Omitted = unchanged, [] clears a list, null on a list is rejected.
    headline: clean_text(120) = None  # type: ignore[valid-type]
    location: clean_text(100) = None  # type: ignore[valid-type]
    languages: tag_list(8) = PydanticField(default_factory=list)  # type: ignore[valid-type]
    about: clean_text(2000) = None  # type: ignore[valid-type]
    niches: tag_list(10) = PydanticField(default_factory=list)  # type: ignore[valid-type]
    content_formats: tag_list(10) = PydanticField(default_factory=list)  # type: ignore[valid-type]
    platforms: PlatformList = PydanticField(default_factory=list)
    services: ServiceList = PydanticField(default_factory=list)
    availability: Availability | None = None
    media_kit_url: clean_url() = None  # type: ignore[valid-type]
    cover_image_url: clean_image_url() = None  # type: ignore[valid-type]
    accent_color: AccentKey | None = None
    theme: ThemeKey | None = None
    color_mode: ColorMode | None = None
    work_steps: WorkStepList = PydanticField(default_factory=list)
    work_principles: tag_list(6, 40) = PydanticField(default_factory=list)  # type: ignore[valid-type]
    work_tools: tag_list(12) = PydanticField(default_factory=list)  # type: ignore[valid-type]


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str | None = Field(default=None)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int
