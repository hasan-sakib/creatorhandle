import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.user import create_random_user_with_headers
from tests.utils.workspace import get_personal_workspace_id, workspace_headers


def test_signup_creates_personal_workspace(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    response = client.get(f"{settings.API_V1_STR}/workspaces/", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["role"] == "owner"


def test_create_additional_workspace(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    response = client.post(
        f"{settings.API_V1_STR}/workspaces/",
        headers=headers,
        json={"name": "Second Workspace", "slug": f"second-{uuid.uuid4().hex[:8]}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "owner"

    response = client.get(f"{settings.API_V1_STR}/workspaces/", headers=headers)
    assert response.json()["count"] == 2


def test_read_workspace_requires_membership(client: TestClient, db: Session) -> None:
    _, headers_a = create_random_user_with_headers(client, db)
    _, headers_b = create_random_user_with_headers(client, db)
    ws_a = get_personal_workspace_id(client, headers_a)

    response = client.get(f"{settings.API_V1_STR}/workspaces/{ws_a}", headers=headers_b)
    assert response.status_code == 403


def test_update_workspace(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    ws_id = get_personal_workspace_id(client, headers)
    response = client.put(
        f"{settings.API_V1_STR}/workspaces/{ws_id}",
        headers=headers,
        json={"name": "Renamed Workspace"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Renamed Workspace"


def test_members_list_shows_owner(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    ws_id = get_personal_workspace_id(client, headers)
    response = client.get(
        f"{settings.API_V1_STR}/workspaces/{ws_id}/members", headers=headers
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["role"] == "owner"


def test_cannot_demote_last_owner(client: TestClient, db: Session) -> None:
    user, headers = create_random_user_with_headers(client, db)
    ws_id = get_personal_workspace_id(client, headers)
    response = client.put(
        f"{settings.API_V1_STR}/workspaces/{ws_id}/members/{user.id}",
        headers=headers,
        json={"role": "member"},
    )
    assert response.status_code == 400


def test_cannot_remove_last_owner(client: TestClient, db: Session) -> None:
    user, headers = create_random_user_with_headers(client, db)
    ws_id = get_personal_workspace_id(client, headers)
    response = client.delete(
        f"{settings.API_V1_STR}/workspaces/{ws_id}/members/{user.id}",
        headers=headers,
    )
    assert response.status_code == 400


def test_resource_route_requires_workspace_header(
    client: TestClient, db: Session
) -> None:
    _, headers = create_random_user_with_headers(client, db)
    response = client.get(f"{settings.API_V1_STR}/brands/", headers=headers)
    assert response.status_code == 422


def test_resource_route_rejects_non_member_workspace(
    client: TestClient, db: Session
) -> None:
    _, headers_a = create_random_user_with_headers(client, db)
    _, headers_b = create_random_user_with_headers(client, db)
    ws_b = get_personal_workspace_id(client, headers_b)

    response = client.get(
        f"{settings.API_V1_STR}/brands/",
        headers={**headers_a, "X-Workspace-Id": ws_b},
    )
    assert response.status_code == 403
