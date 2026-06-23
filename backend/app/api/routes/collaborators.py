import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Collaborator,
    CollaboratorCreate,
    CollaboratorPublic,
    CollaboratorsPublic,
    CollaboratorUpdate,
    Message,
)

router = APIRouter(prefix="/collaborators", tags=["collaborators"])


@router.get("/", response_model=CollaboratorsPublic)
def read_collaborators(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    count_statement = (
        select(func.count())
        .select_from(Collaborator)
        .where(Collaborator.owner_id == current_user.id)
    )
    count = session.exec(count_statement).one()
    statement = (
        select(Collaborator)
        .where(Collaborator.owner_id == current_user.id)
        .order_by(Collaborator.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    collaborators = session.exec(statement).all()
    return CollaboratorsPublic(data=collaborators, count=count)


@router.get("/{id}", response_model=CollaboratorPublic)
def read_collaborator(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    collaborator = session.get(Collaborator, id)
    if not collaborator:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    if collaborator.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return collaborator


@router.post("/", response_model=CollaboratorPublic)
def create_collaborator(
    *, session: SessionDep, current_user: CurrentUser, collaborator_in: CollaboratorCreate
) -> Any:
    collaborator = Collaborator.model_validate(
        collaborator_in, update={"owner_id": current_user.id}
    )
    session.add(collaborator)
    session.commit()
    session.refresh(collaborator)
    return collaborator


@router.put("/{id}", response_model=CollaboratorPublic)
def update_collaborator(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    collaborator_in: CollaboratorUpdate,
) -> Any:
    collaborator = session.get(Collaborator, id)
    if not collaborator:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    if collaborator.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    update_dict = collaborator_in.model_dump(exclude_unset=True)
    collaborator.sqlmodel_update(update_dict)
    session.add(collaborator)
    session.commit()
    session.refresh(collaborator)
    return collaborator


@router.delete("/{id}")
def delete_collaborator(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    collaborator = session.get(Collaborator, id)
    if not collaborator:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    if collaborator.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(collaborator)
    session.commit()
    return Message(message="Collaborator deleted successfully")
