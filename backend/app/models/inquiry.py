"""Inquiries: messages visitors send from a creator's public page."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import EmailStr, ValidationInfo, field_validator
from sqlalchemy import DateTime
from sqlmodel import AutoString, Field, SQLModel

from app.domain.validators import _clean_text, text as clean_text
from app.models.common import get_datetime_utc

InquiryStatus = Literal["new", "read", "archived", "converted"]
InquiryBudget = Literal["under-500", "500-2k", "2k-5k", "5k-plus", "not-sure"]


class InquiryCreate(SQLModel):
    """What a visitor submits on /@username. `website` is a honeypot: real
    visitors never see the field, so a filled-in value means a bot."""

    name: str = Field(max_length=100)
    email: EmailStr = Field(max_length=255)
    company: clean_text(100) = None  # type: ignore[valid-type]
    budget: InquiryBudget | None = None
    message: str = Field(max_length=2000)
    website: str | None = Field(default=None, max_length=255)

    @field_validator("name", "message")
    @classmethod
    def _required_text(cls, value: str, info: ValidationInfo) -> str:
        cleaned = _clean_text(value)
        minimum = 10 if info.field_name == "message" else 1
        if not cleaned or len(cleaned) < minimum:
            raise ValueError(f"must be at least {minimum} characters")
        return cleaned


class Inquiry(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
    # The creator whose page received it
    recipient_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE", index=True
    )
    name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    company: str | None = Field(default=None, max_length=100)
    budget: str | None = Field(default=None, max_length=20)
    message: str = Field(max_length=2000)
    status: InquiryStatus = Field(default="new", sa_type=AutoString(length=20))  # type: ignore[call-overload]
    # Set when converted into a brand + project
    brand_id: uuid.UUID | None = Field(
        default=None, foreign_key="brand.id", nullable=True, ondelete="SET NULL"
    )
    project_id: uuid.UUID | None = Field(
        default=None, foreign_key="project.id", nullable=True, ondelete="SET NULL"
    )


class InquiryPublic(SQLModel):
    id: uuid.UUID
    created_at: datetime | None = None
    name: str
    email: str
    company: str | None = None
    budget: InquiryBudget | None = None
    message: str
    status: InquiryStatus
    brand_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None


class InquiriesPublic(SQLModel):
    data: list[InquiryPublic]
    count: int
    unread_count: int


class InquiryUpdate(SQLModel):
    # "converted" is only set by the convert endpoint
    status: Literal["new", "read", "archived"]
