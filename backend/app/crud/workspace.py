"""Workspace persistence helpers."""

import re
import uuid

from sqlmodel import Session

from app.models import User, Workspace, WorkspaceMember


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "workspace"


def create_personal_workspace(*, session: Session, user: User) -> Workspace:
    """Every user gets a personal workspace + owner membership on creation."""
    base = _slugify(user.full_name or user.email.split("@")[0])
    slug = f"{base}-{uuid.uuid4().hex[:6]}"
    name = f"{user.full_name or user.email}'s Workspace"
    workspace = Workspace(name=name, slug=slug)
    session.add(workspace)
    session.commit()
    session.refresh(workspace)

    membership = WorkspaceMember(
        workspace_id=workspace.id, user_id=user.id, role="owner", status="active"
    )
    session.add(membership)
    session.commit()
    session.refresh(workspace)
    return workspace
