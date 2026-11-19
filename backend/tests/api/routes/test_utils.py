from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.core.config import settings

API = settings.API_V1_STR


def test_health_check(client: TestClient) -> None:
    r = client.get(f"{API}/utils/health-check/")
    assert r.status_code == 200
    assert r.json() is True


def test_ready_when_dependencies_are_up(client: TestClient) -> None:
    r = client.get(f"{API}/utils/ready/")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["checks"]["database"] == "ok"
    expected_storage = "ok" if settings.media_enabled else "disabled"
    assert body["checks"]["storage"] == expected_storage


def test_ready_reports_database_failure(client: TestClient) -> None:
    with patch(
        "sqlmodel.Session.exec",
        side_effect=OperationalError("SELECT 1", {}, Exception("db down")),
    ):
        r = client.get(f"{API}/utils/ready/")
    assert r.status_code == 503
    assert r.json()["status"] == "error"
    assert r.json()["checks"]["database"] == "error"


def test_responses_carry_a_request_id(client: TestClient) -> None:
    r = client.get(f"{API}/utils/health-check/")
    assert r.headers.get("x-request-id")

    r = client.get(
        f"{API}/utils/health-check/", headers={"X-Request-ID": "trace-me-123"}
    )
    assert r.headers["x-request-id"] == "trace-me-123"
