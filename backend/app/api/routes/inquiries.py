"""The creator's inbox: inquiries sent from their public page.

Inquiries belong to a person (the page owner), not a workspace. Converting
one creates a brand + project in the workspace given by X-Workspace-Id, so
that step goes through the normal workspace permissions.
"""

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep, require_permission
from app.domain.permissions import has_permission
from app.models import (
    Brand,
    InquiriesPublic,
    Inquiry,
    InquiryPublic,
    InquiryStatus,
    InquiryUpdate,
    Message,
    Project,
    ProjectPublic,
    WorkspaceMember,
)

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


def _get_own_inquiry(session: SessionDep, user_id: uuid.UUID, id: uuid.UUID) -> Inquiry:
    inquiry = session.get(Inquiry, id)
    # 404 (not 403) for other people's inquiries: don't reveal they exist
    if not inquiry or inquiry.recipient_id != user_id:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return inquiry


@router.get("/", response_model=InquiriesPublic)
def read_inquiries(
    session: SessionDep,
    current_user: CurrentUser,
    status: InquiryStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    mine = Inquiry.recipient_id == current_user.id
    filters = [mine] if status is None else [mine, Inquiry.status == status]
    count = session.exec(
        select(func.count()).select_from(Inquiry).where(*filters)
    ).one()
    unread = session.exec(
        select(func.count()).select_from(Inquiry).where(mine, Inquiry.status == "new")
    ).one()
    inquiries = session.exec(
        select(Inquiry)
        .where(*filters)
        .order_by(col(Inquiry.created_at).desc(), col(Inquiry.id))
        .offset(skip)
        .limit(limit)
    ).all()
    return InquiriesPublic(data=inquiries, count=count, unread_count=unread)


@router.patch("/{id}", response_model=InquiryPublic)
def update_inquiry(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID, body: InquiryUpdate
) -> Any:
    inquiry = _get_own_inquiry(session, current_user.id, id)
    if inquiry.status == "converted":
        raise HTTPException(status_code=400, detail="Inquiry was already converted")
    inquiry.status = body.status
    session.add(inquiry)
    session.commit()
    session.refresh(inquiry)
    return inquiry


@router.delete("/{id}")
def delete_inquiry(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    inquiry = _get_own_inquiry(session, current_user.id, id)
    session.delete(inquiry)
    session.commit()
    return Message(message="Inquiry deleted successfully")


@router.post("/{id}/convert", response_model=ProjectPublic)
def convert_inquiry(
    session: SessionDep,
    current_user: CurrentUser,
    membership: Annotated[
        WorkspaceMember, Depends(require_permission("projects.create"))
    ],
    id: uuid.UUID,
) -> Any:
    """Turn an inquiry into a project (and its brand) in the current workspace.

    Reuses a brand in the workspace with the same contact email, so repeat
    inquiries from one company don't create duplicate brands.
    """
    inquiry = _get_own_inquiry(session, current_user.id, id)
    if inquiry.status == "converted":
        raise HTTPException(status_code=400, detail="Inquiry was already converted")

    brand = session.exec(
        select(Brand).where(
            Brand.workspace_id == membership.workspace_id,
            func.lower(Brand.contact_email) == inquiry.email.lower(),
        )
    ).first()
    if brand is None:
        if not has_permission(membership.role, "brands.create"):
            raise HTTPException(
                status_code=403, detail="Not enough permissions for this workspace"
            )
        brand = Brand(
            name=inquiry.company or inquiry.name,
            contact_name=inquiry.name,
            contact_email=inquiry.email,
            notes="Created from an inquiry",
            owner_id=current_user.id,
            workspace_id=membership.workspace_id,
        )
        session.add(brand)
        session.flush()

    project = Project(
        title=f"Inquiry from {inquiry.company or inquiry.name}"[:200],
        description=inquiry.message[:500],
        brand_id=brand.id,
        owner_id=current_user.id,
        workspace_id=membership.workspace_id,
    )
    session.add(project)
    session.flush()

    inquiry.status = "converted"
    inquiry.brand_id = brand.id
    inquiry.project_id = project.id
    session.add(inquiry)
    session.commit()
    session.refresh(project)
    return project
