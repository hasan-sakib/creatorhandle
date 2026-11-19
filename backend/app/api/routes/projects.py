import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep, require_permission
from app.core import storage
from app.core.media import is_media_path, owns_media
from app.models import (
    Brand,
    Message,
    Project,
    ProjectCreate,
    ProjectPublic,
    ProjectsPublic,
    ProjectUpdate,
    WorkspaceMember,
)

router = APIRouter(prefix="/projects", tags=["projects"])


def _check_thumbnail(user_id: uuid.UUID, url: str | None) -> None:
    """Uploaded images can only be used by the person who uploaded them."""
    if is_media_path(url) and not owns_media(user_id, url):
        raise HTTPException(
            status_code=400, detail="You can only use images you uploaded"
        )


def _check_brand(
    session: SessionDep, brand_id: uuid.UUID | None, workspace_id: uuid.UUID
) -> None:
    """A project may only link to a brand in the same workspace."""
    if brand_id is None:
        return
    brand = session.get(Brand, brand_id)
    if not brand or brand.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Brand not found")


@router.get("/", response_model=ProjectsPublic)
def read_projects(
    session: SessionDep,
    membership: Annotated[
        WorkspaceMember, Depends(require_permission("projects.view"))
    ],
    skip: int = 0,
    limit: int = 100,
) -> Any:
    count_statement = (
        select(func.count())
        .select_from(Project)
        .where(Project.workspace_id == membership.workspace_id)
    )
    count = session.exec(count_statement).one()
    statement = (
        select(Project)
        .where(Project.workspace_id == membership.workspace_id)
        .order_by(col(Project.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    projects = session.exec(statement).all()
    return ProjectsPublic(data=projects, count=count)


@router.get("/{id}", response_model=ProjectPublic)
def read_project(
    session: SessionDep,
    membership: Annotated[
        WorkspaceMember, Depends(require_permission("projects.view"))
    ],
    id: uuid.UUID,
) -> Any:
    project = session.get(Project, id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.workspace_id != membership.workspace_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return project


@router.post("/", response_model=ProjectPublic)
def create_project(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    membership: Annotated[
        WorkspaceMember, Depends(require_permission("projects.create"))
    ],
    project_in: ProjectCreate,
) -> Any:
    _check_brand(session, project_in.brand_id, membership.workspace_id)
    _check_thumbnail(current_user.id, project_in.thumbnail_url)
    project = Project.model_validate(
        project_in,
        update={"owner_id": current_user.id, "workspace_id": membership.workspace_id},
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.put("/{id}", response_model=ProjectPublic)
def update_project(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    membership: Annotated[
        WorkspaceMember, Depends(require_permission("projects.update"))
    ],
    id: uuid.UUID,
    project_in: ProjectUpdate,
) -> Any:
    project = session.get(Project, id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.workspace_id != membership.workspace_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    update_dict = project_in.model_dump(exclude_unset=True)
    _check_brand(session, update_dict.get("brand_id"), membership.workspace_id)
    _check_thumbnail(current_user.id, update_dict.get("thumbnail_url"))
    old_thumbnail = project.thumbnail_url
    project.sqlmodel_update(update_dict)
    session.add(project)
    session.commit()
    session.refresh(project)
    if (
        old_thumbnail is not None
        and old_thumbnail != project.thumbnail_url
        and owns_media(current_user.id, old_thumbnail)
    ):
        storage.delete_image(old_thumbnail)
    return project


@router.delete("/{id}")
def delete_project(
    session: SessionDep,
    current_user: CurrentUser,
    membership: Annotated[
        WorkspaceMember, Depends(require_permission("projects.delete"))
    ],
    id: uuid.UUID,
) -> Message:
    project = session.get(Project, id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.workspace_id != membership.workspace_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    thumbnail = project.thumbnail_url
    session.delete(project)
    session.commit()
    if thumbnail is not None and owns_media(current_user.id, thumbnail):
        storage.delete_image(thumbnail)
    return Message(message="Project deleted successfully")
