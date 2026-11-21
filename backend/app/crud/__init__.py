"""Persistence helpers, one module per domain; re-exported for `from app import crud`."""

from app.crud.user import (
    DUMMY_HASH,
    authenticate,
    create_user,
    get_or_create_google_user,
    get_user_by_email,
    update_user,
)
from app.crud.workspace import create_personal_workspace

__all__ = [
    "DUMMY_HASH",
    "authenticate",
    "create_personal_workspace",
    "create_user",
    "get_or_create_google_user",
    "get_user_by_email",
    "update_user",
]
