from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.user import create_random_user_with_headers
from tests.utils.utils import random_lower_string


def test_unpublished_profile_returns_404(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    username = random_lower_string()[:20]
    client.patch(
        f"{settings.API_V1_STR}/users/me", headers=headers, json={"username": username}
    )
    r = client.get(f"{settings.API_V1_STR}/public/{username}")
    assert r.status_code == 404


def test_publishing_makes_profile_visible(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    username = random_lower_string()[:20]
    client.patch(
        f"{settings.API_V1_STR}/users/me", headers=headers, json={"username": username}
    )
    client.patch(
        f"{settings.API_V1_STR}/users/me", headers=headers, json={"is_published": True}
    )
    r = client.get(f"{settings.API_V1_STR}/public/{username}")
    assert r.status_code == 200
    assert r.json()["username"] == username


def test_unpublishing_hides_profile_again(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    username = random_lower_string()[:20]
    client.patch(
        f"{settings.API_V1_STR}/users/me", headers=headers, json={"username": username}
    )
    client.patch(
        f"{settings.API_V1_STR}/users/me", headers=headers, json={"is_published": True}
    )
    client.patch(
        f"{settings.API_V1_STR}/users/me", headers=headers, json={"is_published": False}
    )
    r = client.get(f"{settings.API_V1_STR}/public/{username}")
    assert r.status_code == 404


def test_cannot_publish_without_username(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    r = client.patch(
        f"{settings.API_V1_STR}/users/me", headers=headers, json={"is_published": True}
    )
    assert r.status_code == 400


def test_url_unsafe_username_rejected(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    for bad in ("has space", "a/b", "dot.name", "@name"):
        r = client.patch(
            f"{settings.API_V1_STR}/users/me", headers=headers, json={"username": bad}
        )
        assert r.status_code == 422, bad
