import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Message, Task, TaskCreate, TaskPublic, TasksPublic, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=TasksPublic)
def read_tasks(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    count_statement = (
        select(func.count())
        .select_from(Task)
        .where(Task.owner_id == current_user.id)
    )
    count = session.exec(count_statement).one()
    statement = (
        select(Task)
        .where(Task.owner_id == current_user.id)
        .order_by(Task.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    tasks = session.exec(statement).all()
    return TasksPublic(data=tasks, count=count)


@router.get("/{id}", response_model=TaskPublic)
def read_task(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    task = session.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return task


@router.post("/", response_model=TaskPublic)
def create_task(
    *, session: SessionDep, current_user: CurrentUser, task_in: TaskCreate
) -> Any:
    task = Task.model_validate(task_in, update={"owner_id": current_user.id})
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.put("/{id}", response_model=TaskPublic)
def update_task(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    task_in: TaskUpdate,
) -> Any:
    task = session.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    update_dict = task_in.model_dump(exclude_unset=True)
    task.sqlmodel_update(update_dict)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.delete("/{id}")
def delete_task(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    task = session.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(task)
    session.commit()
    return Message(message="Task deleted successfully")
