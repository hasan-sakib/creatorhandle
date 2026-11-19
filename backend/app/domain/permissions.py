"""Centralized role -> permission mapping for workspace-scoped authorization."""

from typing import Literal, get_args

WorkspaceRole = Literal["owner", "admin", "manager", "member", "viewer"]
# Only "active" memberships grant access; "inactive" keeps the row but revokes it.
MemberStatus = Literal["active", "inactive"]

ROLES: tuple[str, ...] = get_args(WorkspaceRole)

_RESOURCE_CRUD_PERMISSIONS = [
    f"{resource}.{action}"
    for resource in ("brands", "projects", "tasks", "collaborators")
    for action in ("view", "create", "update", "delete")
]

_ALL_PERMISSIONS = {
    "workspace.view",
    "workspace.update",
    "workspace.delete",
    "members.view",
    "members.invite",
    "members.update",
    "members.remove",
    *_RESOURCE_CRUD_PERMISSIONS,
}

_VIEW_ONLY_PERMISSIONS = {p for p in _ALL_PERMISSIONS if p.endswith(".view")}

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "owner": set(_ALL_PERMISSIONS),
    "admin": set(_ALL_PERMISSIONS) - {"workspace.delete"},
    "manager": {
        *_RESOURCE_CRUD_PERMISSIONS,
        "workspace.view",
        "members.view",
        "members.invite",
    },
    "member": {
        *(p for p in _RESOURCE_CRUD_PERMISSIONS if not p.endswith(".delete")),
        "workspace.view",
        "members.view",
    },
    "viewer": set(_VIEW_ONLY_PERMISSIONS),
}


def has_permission(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())
