import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep, require_workspace_permission
from app.models import (
    Message,
    User,
    Workspace,
    WorkspaceCreate,
    WorkspaceMember,
    WorkspaceMemberPublic,
    WorkspaceMembersPublic,
    WorkspaceMemberUpdate,
    WorkspacePublic,
    WorkspacesPublic,
    WorkspaceUpdate,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


def _to_public(workspace: Workspace, role: str) -> WorkspacePublic:
    return WorkspacePublic(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        logo_url=workspace.logo_url,
        description=workspace.description,
        timezone=workspace.timezone,
        workspace_type=workspace.workspace_type,
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
        role=role,
    )


def _member_to_public(
    member: WorkspaceMember, user: User | None
) -> WorkspaceMemberPublic:
    return WorkspaceMemberPublic(
        id=member.id,
        workspace_id=member.workspace_id,
        user_id=member.user_id,
        role=member.role,
        status=member.status,
        joined_at=member.joined_at,
        full_name=user.full_name if user else None,
        email=user.email if user else None,
        avatar_url=user.avatar_url if user else None,
    )


def _active_owner_count(session: SessionDep, workspace_id: uuid.UUID) -> int:
    return session.exec(
        select(func.count())
        .select_from(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.role == "owner",
            WorkspaceMember.status == "active",
        )
    ).one()


@router.get("/", response_model=WorkspacesPublic)
def read_workspaces(session: SessionDep, current_user: CurrentUser) -> Any:
    memberships = session.exec(
        select(WorkspaceMember).where(
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.status == "active",
        )
    ).all()
    data = []
    for membership in memberships:
        workspace = session.get(Workspace, membership.workspace_id)
        if workspace:
            data.append(_to_public(workspace, membership.role))
    return WorkspacesPublic(data=data, count=len(data))


@router.post("/", response_model=WorkspacePublic)
def create_workspace(
    *, session: SessionDep, current_user: CurrentUser, workspace_in: WorkspaceCreate
) -> Any:
    existing = session.exec(
        select(Workspace).where(Workspace.slug == workspace_in.slug)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="That workspace slug is taken")
    workspace = Workspace.model_validate(workspace_in)
    session.add(workspace)
    session.commit()
    session.refresh(workspace)
    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="owner",
        status="active",
    )
    session.add(membership)
    session.commit()
    session.refresh(workspace)
    return _to_public(workspace, "owner")


@router.get("/{id}", response_model=WorkspacePublic)
def read_workspace(
    session: SessionDep,
    id: uuid.UUID,
    membership: Annotated[
        WorkspaceMember, Depends(require_workspace_permission("workspace.view"))
    ],
) -> Any:
    workspace = session.get(Workspace, id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return _to_public(workspace, membership.role)


@router.put("/{id}", response_model=WorkspacePublic)
def update_workspace(
    *,
    session: SessionDep,
    id: uuid.UUID,
    workspace_in: WorkspaceUpdate,
    membership: Annotated[
        WorkspaceMember, Depends(require_workspace_permission("workspace.update"))
    ],
) -> Any:
    workspace = session.get(Workspace, id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    update_dict = workspace_in.model_dump(exclude_unset=True)
    workspace.sqlmodel_update(update_dict)
    session.add(workspace)
    session.commit()
    session.refresh(workspace)
    return _to_public(workspace, membership.role)


@router.delete("/{id}")
def delete_workspace(
    session: SessionDep,
    id: uuid.UUID,
    _membership: Annotated[
        WorkspaceMember, Depends(require_workspace_permission("workspace.delete"))
    ],
) -> Message:
    workspace = session.get(Workspace, id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    session.delete(workspace)
    session.commit()
    return Message(message="Workspace deleted successfully")


@router.get("/{id}/members", response_model=WorkspaceMembersPublic)
def read_workspace_members(
    session: SessionDep,
    id: uuid.UUID,
    _membership: Annotated[
        WorkspaceMember, Depends(require_workspace_permission("members.view"))
    ],
) -> Any:
    members = session.exec(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == id, WorkspaceMember.status == "active"
        )
    ).all()
    data = [_member_to_public(m, session.get(User, m.user_id)) for m in members]
    return WorkspaceMembersPublic(data=data, count=len(data))


@router.put("/{id}/members/{user_id}", response_model=WorkspaceMemberPublic)
def update_workspace_member(
    *,
    session: SessionDep,
    id: uuid.UUID,
    user_id: uuid.UUID,
    member_in: WorkspaceMemberUpdate,
    membership: Annotated[
        WorkspaceMember, Depends(require_workspace_permission("members.update"))
    ],
) -> Any:
    target = session.exec(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == id, WorkspaceMember.user_id == user_id
        )
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")

    # Ownership is only granted or changed by owners (admins hold members.update
    # too, and could otherwise promote themselves or demote an owner).
    touches_owner = target.role == "owner" or member_in.role == "owner"
    if touches_owner and membership.role != "owner":
        raise HTTPException(
            status_code=403, detail="Only an owner can change ownership"
        )

    stops_being_owner = target.role == "owner" and (
        (member_in.role is not None and member_in.role != "owner")
        or (member_in.status is not None and member_in.status != "active")
    )
    if stops_being_owner and _active_owner_count(session, id) <= 1:
        raise HTTPException(
            status_code=400, detail="Cannot demote the last owner of a workspace"
        )

    update_dict = member_in.model_dump(exclude_unset=True)
    target.sqlmodel_update(update_dict)
    session.add(target)
    session.commit()
    session.refresh(target)
    return _member_to_public(target, session.get(User, target.user_id))


@router.delete("/{id}/members/{user_id}")
def remove_workspace_member(
    session: SessionDep,
    id: uuid.UUID,
    user_id: uuid.UUID,
    _membership: Annotated[
        WorkspaceMember, Depends(require_workspace_permission("members.remove"))
    ],
) -> Message:
    target = session.exec(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == id, WorkspaceMember.user_id == user_id
        )
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")

    if target.role == "owner" and _active_owner_count(session, id) <= 1:
        raise HTTPException(
            status_code=400, detail="Cannot remove the last owner of a workspace"
        )

    session.delete(target)
    session.commit()
    return Message(message="Member removed successfully")
