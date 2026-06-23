from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import SQLModel, func, select

from app.api.deps import SessionDep
from app.models import Brand, BrandsPublic, Project, ProjectsPublic, Task, User

router = APIRouter(prefix="/public", tags=["public"])


class CreatorStats(SQLModel):
    brands_count: int
    projects_count: int
    tasks_done: int
    tasks_total: int


class CreatorProfile(SQLModel):
    full_name: str | None
    username: str
    created_at: str | None
    bio: str | None = None
    website: str | None = None
    twitter: str | None = None
    instagram: str | None = None
    youtube: str | None = None
    tiktok: str | None = None
    stats: CreatorStats


def _get_user_by_username(session: SessionDep, username: str) -> User:
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Creator not found")
    return user


@router.get("/{username}", response_model=CreatorProfile)
def get_creator_profile(session: SessionDep, username: str) -> Any:
    user = _get_user_by_username(session, username)

    brands_count = session.exec(
        select(func.count())
        .select_from(Brand)
        .where(Brand.owner_id == user.id, Brand.status == "active")
    ).one()

    projects_count = session.exec(
        select(func.count())
        .select_from(Project)
        .where(Project.owner_id == user.id, Project.platform_status != "Cancelled")
    ).one()

    tasks_total = session.exec(
        select(func.count()).select_from(Task).where(Task.owner_id == user.id)
    ).one()

    tasks_done = session.exec(
        select(func.count())
        .select_from(Task)
        .where(Task.owner_id == user.id, Task.status == "Done")
    ).one()

    return CreatorProfile(
        full_name=user.full_name,
        username=user.username,
        created_at=user.created_at.isoformat() if user.created_at else None,
        bio=user.bio,
        website=user.website,
        twitter=user.twitter,
        instagram=user.instagram,
        youtube=user.youtube,
        tiktok=user.tiktok,
        stats=CreatorStats(
            brands_count=brands_count,
            projects_count=projects_count,
            tasks_done=tasks_done,
            tasks_total=tasks_total,
        ),
    )


@router.get("/{username}/brands", response_model=BrandsPublic)
def get_creator_brands(session: SessionDep, username: str) -> Any:
    user = _get_user_by_username(session, username)

    brands = session.exec(
        select(Brand)
        .where(Brand.owner_id == user.id, Brand.status == "active")
        .order_by(Brand.name)
    ).all()

    return BrandsPublic(data=brands, count=len(brands))


@router.get("/{username}/projects", response_model=ProjectsPublic)
def get_creator_projects(session: SessionDep, username: str) -> Any:
    user = _get_user_by_username(session, username)

    projects = session.exec(
        select(Project)
        .where(Project.owner_id == user.id, Project.platform_status != "Cancelled")
        .order_by(Project.created_at.desc())
    ).all()

    return ProjectsPublic(data=projects, count=len(projects))
