import uuid
from collections.abc import Callable, Generator
from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session, select

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.domain.permissions import has_permission
from app.models import TokenPayload, User, Workspace, WorkspaceMember

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_workspace_id(
    x_workspace_id: Annotated[uuid.UUID, Header(include_in_schema=False)],
) -> uuid.UUID:
    return x_workspace_id


def get_current_membership(
    session: SessionDep,
    current_user: CurrentUser,
    workspace_id: Annotated[uuid.UUID, Depends(get_workspace_id)],
) -> WorkspaceMember:
    workspace = session.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    membership = session.exec(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.status == "active",
        )
    ).first()
    if not membership:
        raise HTTPException(
            status_code=403, detail="You are not a member of this workspace"
        )
    return membership


CurrentMembership = Annotated[WorkspaceMember, Depends(get_current_membership)]


def require_permission(
    permission: str,
) -> Callable[[WorkspaceMember], WorkspaceMember]:
    """For resource routes (brands/projects/tasks/collaborators) — workspace comes
    from the X-Workspace-Id header."""

    def _dependency(membership: CurrentMembership) -> WorkspaceMember:
        if not has_permission(membership.role, permission):
            raise HTTPException(
                status_code=403, detail="Not enough permissions for this workspace"
            )
        return membership

    return _dependency


def get_membership_by_path_id(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> WorkspaceMember:
    """For /workspaces/{id}* routes — workspace comes from the URL path, not the header."""
    workspace = session.get(Workspace, id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    membership = session.exec(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == id,
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.status == "active",
        )
    ).first()
    if not membership:
        raise HTTPException(
            status_code=403, detail="You are not a member of this workspace"
        )
    return membership


def require_workspace_permission(
    permission: str,
) -> Callable[[WorkspaceMember], WorkspaceMember]:
    def _dependency(
        membership: Annotated[WorkspaceMember, Depends(get_membership_by_path_id)],
    ) -> WorkspaceMember:
        if not has_permission(membership.role, permission):
            raise HTTPException(
                status_code=403, detail="Not enough permissions for this workspace"
            )
        return membership

    return _dependency
