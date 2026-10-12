import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.user import create_random_user_with_headers
from tests.utils.workspace import workspace_headers

RESOURCES = {
    "brands": {"name": "Acme Co"},
    "projects": {"title": "Launch Campaign"},
    "tasks": {"title": "Write brief"},
    "collaborators": {"name": "Jamie Doe", "role": "Designer"},
}


@pytest.mark.parametrize("resource", RESOURCES.keys())
def test_cannot_read_other_tenants_resource_by_id(
    client: TestClient, db: Session, resource: str
) -> None:
    _, headers_a = create_random_user_with_headers(client, db)
    _, headers_b = create_random_user_with_headers(client, db)
    a_headers = workspace_headers(client, headers_a)
    b_headers = workspace_headers(client, headers_b)

    create = client.post(
        f"{settings.API_V1_STR}/{resource}/", headers=a_headers, json=RESOURCES[resource]
    )
    assert create.status_code == 200
    resource_id = create.json()["id"]

    # User B, in their own workspace, must not be able to read User A's resource by ID.
    read_as_b = client.get(
        f"{settings.API_V1_STR}/{resource}/{resource_id}", headers=b_headers
    )
    assert read_as_b.status_code == 403

    # ...nor update it...
    update_as_b = client.put(
        f"{settings.API_V1_STR}/{resource}/{resource_id}", headers=b_headers, json={}
    )
    assert update_as_b.status_code == 403

    # ...nor delete it.
    delete_as_b = client.delete(
        f"{settings.API_V1_STR}/{resource}/{resource_id}", headers=b_headers
    )
    assert delete_as_b.status_code == 403

    # The resource must still be readable, untouched, by its own owner.
    read_as_a = client.get(
        f"{settings.API_V1_STR}/{resource}/{resource_id}", headers=a_headers
    )
    assert read_as_a.status_code == 200


@pytest.mark.parametrize("resource", RESOURCES.keys())
def test_list_only_returns_own_workspace_resources(
    client: TestClient, db: Session, resource: str
) -> None:
    _, headers_a = create_random_user_with_headers(client, db)
    _, headers_b = create_random_user_with_headers(client, db)
    a_headers = workspace_headers(client, headers_a)
    b_headers = workspace_headers(client, headers_b)

    client.post(
        f"{settings.API_V1_STR}/{resource}/", headers=a_headers, json=RESOURCES[resource]
    )

    listed_for_b = client.get(f"{settings.API_V1_STR}/{resource}/", headers=b_headers)
    assert listed_for_b.status_code == 200
    assert listed_for_b.json()["count"] == 0
