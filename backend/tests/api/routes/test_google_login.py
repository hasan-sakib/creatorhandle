from typing import Any
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from tests.utils.utils import random_email

URL = f"{settings.API_V1_STR}/login/google"
CLIENT_ID = "our-app.apps.googleusercontent.com"


def _google(tokeninfo: dict[str, Any] | None, userinfo: dict[str, Any]) -> AsyncMock:
    """Fake httpx.AsyncClient.get for Google's tokeninfo/userinfo endpoints."""

    async def get(url: str, **_: Any) -> httpx.Response:
        request = httpx.Request("GET", url)
        if "tokeninfo" in url:
            if tokeninfo is None:
                return httpx.Response(
                    400, json={"error": "invalid_token"}, request=request
                )
            return httpx.Response(200, json=tokeninfo, request=request)
        return httpx.Response(200, json=userinfo, request=request)

    return AsyncMock(side_effect=get)


@pytest.fixture
def userinfo() -> dict[str, Any]:
    return {"email": random_email(), "email_verified": True, "name": "G User"}


def test_rejects_token_issued_to_another_app(
    client: TestClient, userinfo: dict[str, Any]
) -> None:
    fake = _google({"aud": "someone-else.apps.googleusercontent.com"}, userinfo)
    with (
        patch.object(settings, "GOOGLE_CLIENT_ID", CLIENT_ID),
        patch.object(httpx.AsyncClient, "get", fake),
    ):
        r = client.post(URL, json={"token": "t"})
    assert r.status_code == 400
    assert not any("userinfo" in c.args[0] for c in fake.call_args_list)


def test_rejects_invalid_token(client: TestClient, userinfo: dict[str, Any]) -> None:
    with (
        patch.object(settings, "GOOGLE_CLIENT_ID", CLIENT_ID),
        patch.object(httpx.AsyncClient, "get", _google(None, userinfo)),
    ):
        r = client.post(URL, json={"token": "t"})
    assert r.status_code == 400


def test_accepts_token_for_this_app(
    client: TestClient, userinfo: dict[str, Any]
) -> None:
    with (
        patch.object(settings, "GOOGLE_CLIENT_ID", CLIENT_ID),
        patch.object(httpx.AsyncClient, "get", _google({"aud": CLIENT_ID}, userinfo)),
    ):
        r = client.post(URL, json={"token": "t"})
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_without_client_id_skips_audience_check(
    client: TestClient, userinfo: dict[str, Any]
) -> None:
    fake = _google(None, userinfo)
    with (
        patch.object(settings, "GOOGLE_CLIENT_ID", ""),
        patch.object(httpx.AsyncClient, "get", fake),
    ):
        r = client.post(URL, json={"token": "t"})
    assert r.status_code == 200
    assert not any("tokeninfo" in c.args[0] for c in fake.call_args_list)
