from collections.abc import Generator
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.core import rate_limit
from app.core.config import settings
from tests.utils.utils import random_email

API = settings.API_V1_STR


@pytest.fixture
def limits_on() -> Generator[None, None, None]:
    # Off for the rest of the suite (ENVIRONMENT=local); switch on here
    rate_limit.reset()
    with patch.object(settings, "RATE_LIMIT_ENABLED", True):
        yield
    rate_limit.reset()


def test_rate_limit_is_off_locally_by_default() -> None:
    assert settings.ENVIRONMENT != "local" or settings.RATE_LIMIT_ENABLED is False


@pytest.mark.usefixtures("limits_on")
def test_login_attempts_for_one_account_are_limited(client: TestClient) -> None:
    email = random_email()
    body = {"username": email, "password": "wrong-password"}
    for _ in range(10):
        r = client.post(f"{API}/login/access-token", data=body)
        assert r.status_code == 400
    r = client.post(f"{API}/login/access-token", data=body)
    assert r.status_code == 429
    assert int(r.headers["Retry-After"]) > 0

    # Another account from the same client still gets its own budget
    other = {"username": random_email(), "password": "wrong-password"}
    assert client.post(f"{API}/login/access-token", data=other).status_code == 400


@pytest.mark.usefixtures("limits_on")
def test_password_recovery_is_limited(client: TestClient) -> None:
    for _ in range(5):
        r = client.post(f"{API}/password-recovery/{random_email()}")
        assert r.status_code == 200
    r = client.post(f"{API}/password-recovery/{random_email()}")
    assert r.status_code == 429


@pytest.mark.usefixtures("limits_on")
def test_signup_is_limited(client: TestClient) -> None:
    def signup() -> int:
        body = {"email": random_email(), "password": "a-long-password"}
        return client.post(f"{API}/users/signup", json=body).status_code

    assert all(signup() == 200 for _ in range(10))
    assert signup() == 429
