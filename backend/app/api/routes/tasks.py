import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import selectinload
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep, require_permission
from app.models import (
    Collaborator,
    Message,
    Project,
    Task,
    TaskCreate,
    TaskPublic,
    TasksPublic,
    TaskUpdate,
    WorkspaceMember,
)

# SQLModel types relationship attributes as the related model, not as
# SQLAlchemy InstrumentedAttribute, so mypy rejects them in loader options.
_WITH_COLLABORATOR = selectinload(Task.collaborator)  # type: ignore[arg-type]

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _check_references(
    session: SessionDep, data: dict[str, Any], workspace_id: uuid.UUID
) -> None:
    """A task may only point at a project, collaborator and assignee that belong
    to the same workspace. Unknown and foreign ids get the same 404, so ids
    from other workspaces can't be probed."""
    project_id = data.get("project_id")
    if project_id is not None:
        project = session.get(Project, project_id)
        if not project or project.workspace_id != workspace_id:
            raise HTTPException(status_code=404, detail="Project not found")

    collaborator_id = data.get("collaborator_id")
    if collaborator_id is not None:
        collaborator = session.get(Collaborator, collaborator_id)
        if not collaborator or collaborator.workspace_id != workspace_id:
            raise HTTPException(status_code=404, detail="Collaborator not found")

    assigned_to = data.get("assigned_to")
    if assigned_to is not None:
        member = session.exec(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == assigned_to,
                WorkspaceMember.status == "active",
            )
        ).first()
        if not member:
            raise HTTPException(status_code=404, detail="Assignee not found")


@router.get("/", response_model=TasksPublic)
def read_tasks(
    session: SessionDep,
    membership: Annotated[WorkspaceMember, Depends(require_permission("tasks.view"))],
    skip: int = 0,
    limit: int = 100,
) -> Any:
    count_statement = (
        select(func.count())
        .select_from(Task)
        .where(Task.workspace_id == membership.workspace_id)
    )
    count = session.exec(count_statement).one()
    statement = (
        select(Task)
        .where(Task.workspace_id == membership.workspace_id)
        .options(_WITH_COLLABORATOR)
        .order_by(col(Task.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    tasks = session.exec(statement).all()
    return TasksPublic(data=tasks, count=count)


@router.get("/{id}", response_model=TaskPublic)
def read_task(
    session: SessionDep,
    membership: Annotated[WorkspaceMember, Depends(require_permission("tasks.view"))],
    id: uuid.UUID,
) -> Any:
    statement = select(Task).where(Task.id == id).options(_WITH_COLLABORATOR)
    task = session.exec(statement).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.workspace_id != membership.workspace_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return task


@router.post("/", response_model=TaskPublic)
def create_task(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    membership: Annotated[WorkspaceMember, Depends(require_permission("tasks.create"))],
    task_in: TaskCreate,
) -> Any:
    _check_references(session, task_in.model_dump(), membership.workspace_id)
    task = Task.model_validate(
        task_in,
        update={"owner_id": current_user.id, "workspace_id": membership.workspace_id},
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    if task.collaborator_id:
        session.refresh(task, attribute_names=["collaborator"])
    return task


@router.put("/{id}", response_model=TaskPublic)
def update_task(
    *,
    session: SessionDep,
    membership: Annotated[WorkspaceMember, Depends(require_permission("tasks.update"))],
    id: uuid.UUID,
    task_in: TaskUpdate,
) -> Any:
    task = session.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.workspace_id != membership.workspace_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    update_dict = task_in.model_dump(exclude_unset=True)
    _check_references(session, update_dict, membership.workspace_id)
    task.sqlmodel_update(update_dict)
    session.add(task)
    session.commit()
    session.refresh(task)
    if task.collaborator_id:
        session.refresh(task, attribute_names=["collaborator"])
    return task


@router.delete("/{id}")
def delete_task(
    session: SessionDep,
    membership: Annotated[WorkspaceMember, Depends(require_permission("tasks.delete"))],
    id: uuid.UUID,
) -> Message:
    task = session.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.workspace_id != membership.workspace_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(task)
    session.commit()
    return Message(message="Task deleted successfully")
