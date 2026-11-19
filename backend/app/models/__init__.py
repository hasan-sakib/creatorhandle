"""Database tables and API schemas, one module per domain.

Everything is re-exported here so `from app.models import X` keeps working.
Import order matters: SQLAlchemy resolves string relationship targets
(e.g. list["Task"]) from this registry, so every module must be imported.
"""

from sqlmodel import SQLModel

from app.models.auth import (
    NewPassword,
    Token,
    TokenPayload,
)
from app.models.brand import (
    Brand,
    BrandBase,
    BrandCreate,
    BrandPublic,
    BrandsPublic,
    BrandUpdate,
)
from app.models.collaborator import (
    Collaborator,
    CollaboratorBase,
    CollaboratorCreate,
    CollaboratorPublic,
    CollaboratorsPublic,
    CollaboratorUpdate,
)
from app.models.common import (
    Message,
    get_datetime_utc,
    json_list_field,
)
from app.models.item import (
    Item,
    ItemBase,
    ItemCreate,
    ItemPublic,
    ItemsPublic,
    ItemUpdate,
)
from app.models.project import (
    Project,
    ProjectBase,
    ProjectCreate,
    ProjectPublic,
    ProjectsPublic,
    ProjectUpdate,
)
from app.models.task import (
    Task,
    TaskBase,
    TaskCreate,
    TaskPublic,
    TasksPublic,
    TaskUpdate,
)
from app.models.user import (
    UpdatePassword,
    User,
    UserBase,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.models.workspace import (
    Workspace,
    WorkspaceBase,
    WorkspaceCreate,
    WorkspaceMember,
    WorkspaceMemberBase,
    WorkspaceMemberPublic,
    WorkspaceMembersPublic,
    WorkspaceMemberUpdate,
    WorkspacePublic,
    WorkspacesPublic,
    WorkspaceUpdate,
)

__all__ = [
    "Brand",
    "BrandBase",
    "BrandCreate",
    "BrandPublic",
    "BrandUpdate",
    "BrandsPublic",
    "Collaborator",
    "CollaboratorBase",
    "CollaboratorCreate",
    "CollaboratorPublic",
    "CollaboratorUpdate",
    "CollaboratorsPublic",
    "Item",
    "ItemBase",
    "ItemCreate",
    "ItemPublic",
    "ItemUpdate",
    "ItemsPublic",
    "Message",
    "NewPassword",
    "Project",
    "ProjectBase",
    "ProjectCreate",
    "ProjectPublic",
    "ProjectUpdate",
    "ProjectsPublic",
    "SQLModel",
    "Task",
    "TaskBase",
    "TaskCreate",
    "TaskPublic",
    "TaskUpdate",
    "TasksPublic",
    "Token",
    "TokenPayload",
    "UpdatePassword",
    "User",
    "UserBase",
    "UserCreate",
    "UserPublic",
    "UserRegister",
    "UserUpdate",
    "UserUpdateMe",
    "UsersPublic",
    "Workspace",
    "WorkspaceBase",
    "WorkspaceCreate",
    "WorkspaceMember",
    "WorkspaceMemberBase",
    "WorkspaceMemberPublic",
    "WorkspaceMemberUpdate",
    "WorkspaceMembersPublic",
    "WorkspacePublic",
    "WorkspaceUpdate",
    "WorkspacesPublic",
    "get_datetime_utc",
    "json_list_field",
]
