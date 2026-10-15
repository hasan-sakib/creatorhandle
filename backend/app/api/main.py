from fastapi import APIRouter

from app.api.routes import (
    brands,
    collaborators,
    items,
    login,
    private,
    projects,
    public,
    tasks,
    uploads,
    users,
    utils,
    workspaces,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(workspaces.router)
api_router.include_router(brands.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
api_router.include_router(collaborators.router)
api_router.include_router(public.router)
api_router.include_router(uploads.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
