"""Characterization tests for the workspace resources: brands, projects,
tasks and collaborators. They pin down current behavior (status codes,
echoed fields, cascades) so refactors can't change it unnoticed.
"""

from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.user import create_random_user_with_headers
from tests.utils.workspace import workspace_headers

API = settings.API_V1_STR

# resource -> (create payload, update payload)
CASES: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {
    "brands": (
        {"name": "Acme Co", "category": "Tech", "contact_email": "a@acme.test"},
        {"name": "Acme Inc", "status": "paused"},
    ),
    "projects": (
        {"title": "Launch Campaign", "type": "Video", "tags": ["launch"]},
        {"title": "Launch Campaign v2", "platform_status": "In Progress"},
    ),
    "tasks": (
        {"title": "Write brief", "priority": "High"},
        {"status": "Done"},
    ),
    "collaborators": (
        {"name": "Jamie Doe", "role": "Designer"},
        {"role": "Editor"},
    ),
}


@pytest.fixture
def ws_headers(client: TestClient, db: Session) -> dict[str, str]:
    _, headers = create_random_user_with_headers(client, db)
    return workspace_headers(client, headers)


@pytest.mark.parametrize("resource", CASES.keys())
def test_crud_lifecycle(
    client: TestClient, ws_headers: dict[str, str], resource: str
) -> None:
    create_body, update_body = CASES[resource]

    created = client.post(f"{API}/{resource}/", headers=ws_headers, json=create_body)
    assert created.status_code == 200
    item = created.json()
    for key, value in create_body.items():
        assert item[key] == value
    assert item["workspace_id"] == ws_headers["X-Workspace-Id"]

    url = f"{API}/{resource}/{item['id']}"
    read = client.get(url, headers=ws_headers)
    assert read.status_code == 200
    assert read.json()["id"] == item["id"]

    listed = client.get(f"{API}/{resource}/", headers=ws_headers)
    assert listed.status_code == 200
    assert listed.json()["count"] == 1
    assert [r["id"] for r in listed.json()["data"]] == [item["id"]]

    updated = client.put(url, headers=ws_headers, json=update_body)
    assert updated.status_code == 200
    for key, value in update_body.items():
        assert updated.json()[key] == value

    deleted = client.delete(url, headers=ws_headers)
    assert deleted.status_code == 200
    assert "message" in deleted.json()
    assert client.get(url, headers=ws_headers).status_code == 404


@pytest.mark.parametrize("resource", CASES.keys())
def test_requires_authentication(client: TestClient, resource: str) -> None:
    assert client.get(f"{API}/{resource}/").status_code == 401


@pytest.mark.parametrize("resource", CASES.keys())
def test_missing_resource_is_404(
    client: TestClient, ws_headers: dict[str, str], resource: str
) -> None:
    missing = "00000000-0000-4000-8000-000000000000"
    assert (
        client.get(f"{API}/{resource}/{missing}", headers=ws_headers).status_code == 404
    )


def test_task_embeds_its_collaborator(
    client: TestClient, ws_headers: dict[str, str]
) -> None:
    collaborator = client.post(
        f"{API}/collaborators/",
        headers=ws_headers,
        json={"name": "Sam", "role": "Editor"},
    ).json()
    task = client.post(
        f"{API}/tasks/",
        headers=ws_headers,
        json={"title": "Edit video", "collaborator_id": collaborator["id"]},
    ).json()
    assert task["collaborator"]["id"] == collaborator["id"]
    assert task["collaborator"]["name"] == "Sam"


def test_deleting_collaborator_unassigns_tasks(
    client: TestClient, ws_headers: dict[str, str]
) -> None:
    collaborator = client.post(
        f"{API}/collaborators/",
        headers=ws_headers,
        json={"name": "Sam", "role": "Editor"},
    ).json()
    task = client.post(
        f"{API}/tasks/",
        headers=ws_headers,
        json={"title": "Edit video", "collaborator_id": collaborator["id"]},
    ).json()

    client.delete(f"{API}/collaborators/{collaborator['id']}", headers=ws_headers)

    after = client.get(f"{API}/tasks/{task['id']}", headers=ws_headers)
    assert after.status_code == 200
    assert after.json()["collaborator_id"] is None


def test_deleting_brand_deletes_its_projects_and_their_tasks(
    client: TestClient, ws_headers: dict[str, str]
) -> None:
    brand = client.post(
        f"{API}/brands/", headers=ws_headers, json={"name": "Acme"}
    ).json()
    project = client.post(
        f"{API}/projects/",
        headers=ws_headers,
        json={"title": "Spot", "brand_id": brand["id"]},
    ).json()
    task = client.post(
        f"{API}/tasks/",
        headers=ws_headers,
        json={"title": "Storyboard", "project_id": project["id"]},
    ).json()

    assert (
        client.delete(f"{API}/brands/{brand['id']}", headers=ws_headers).status_code
        == 200
    )

    assert (
        client.get(f"{API}/projects/{project['id']}", headers=ws_headers).status_code
        == 404
    )
    assert (
        client.get(f"{API}/tasks/{task['id']}", headers=ws_headers).status_code == 404
    )


def test_project_rejects_brand_from_another_workspace(
    client: TestClient, db: Session, ws_headers: dict[str, str]
) -> None:
    _, other = create_random_user_with_headers(client, db)
    other_brand = client.post(
        f"{API}/brands/", headers=workspace_headers(client, other), json={"name": "X"}
    ).json()

    r = client.post(
        f"{API}/projects/",
        headers=ws_headers,
        json={"title": "Spot", "brand_id": other_brand["id"]},
    )
    assert r.status_code in (400, 403, 404)
