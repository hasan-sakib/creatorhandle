"""Helpers shared by all models and generic API payloads."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(UTC)


def json_list_field() -> Any:
    """A JSONB list column, NOT NULL, defaulting to [] in Python and in the DB.

    Always replace the whole list on update; never mutate it in place.
    """
    return Field(
        default_factory=list,
        sa_type=JSONB,
        nullable=False,
        sa_column_kwargs={"server_default": text("'[]'::jsonb")},
    )


# Generic message
class Message(SQLModel):
    message: str
