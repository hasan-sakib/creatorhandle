from typing import Any
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.user import create_random_user_with_headers
from tests.utils.utils import random_email, random_lower_string
from tests.utils.workspace import workspace_headers

API = settings.API_V1_STR


def published_creator(client: TestClient, db: Session) -> tuple[str, dict[str, str]]:
    _, headers = create_random_user_with_headers(client, db)
    username = random_lower_string()[:20]
    r = client.patch(
        f"{API}/users/me",
        headers=headers,
        json={"username": username, "is_published": True},
    )
    assert r.status_code == 200
    return username, headers


def inquiry_body(**overrides: Any) -> dict[str, Any]:
    return {
        "name": "Sam Brand",
        "email": random_email(),
        "company": "Acme",
        "budget": "2k-5k",
        "message": "We'd love to work with you on a launch video.",
        **overrides,
    }


def send(client: TestClient, username: str, **overrides: Any) -> Any:
    return client.post(
        f"{API}/public/{username}/inquiries", json=inquiry_body(**overrides)
    )


def inbox(client: TestClient, headers: dict[str, str], **params: Any) -> Any:
    r = client.get(f"{API}/inquiries/", headers=headers, params=params)
    assert r.status_code == 200
    return r.json()


def test_visitor_inquiry_lands_in_creator_inbox(
    client: TestClient, db: Session
) -> None:
    username, headers = published_creator(client, db)
    r = send(client, username)
    assert r.status_code == 200

    data = inbox(client, headers)
    assert data["count"] == 1
    assert data["unread_count"] == 1
    item = data["data"][0]
    assert item["status"] == "new"
    assert item["company"] == "Acme"
    assert item["budget"] == "2k-5k"


def test_inquiry_to_unpublished_or_unknown_creator_is_404(
    client: TestClient, db: Session
) -> None:
    _, headers = create_random_user_with_headers(client, db)
    hidden = random_lower_string()[:20]
    client.patch(f"{API}/users/me", headers=headers, json={"username": hidden})
    assert send(client, hidden).status_code == 404
    assert send(client, "nobody-" + random_lower_string()[:8]).status_code == 404


def test_honeypot_is_accepted_but_not_stored(client: TestClient, db: Session) -> None:
    username, headers = published_creator(client, db)
    r = send(client, username, website="http://spam.example")
    assert r.status_code == 200
    assert inbox(client, headers)["count"] == 0


@pytest.mark.parametrize(
    "overrides",
    [
        {"name": "   "},
        {"email": "not-an-email"},
        {"message": "short"},
        {"message": "x" * 2001},
        {"budget": "a million"},
        {"name": "Sam\x00"},
    ],
)
def test_invalid_inquiries_are_rejected(
    client: TestClient, db: Session, overrides: dict[str, Any]
) -> None:
    username, _ = published_creator(client, db)
    assert send(client, username, **overrides).status_code == 422


def test_creator_is_emailed_with_reply_to_sender(
    client: TestClient, db: Session
) -> None:
    username, _ = published_creator(client, db)
    with (
        patch("app.api.routes.public.send_email", return_value=None) as mail,
        patch("app.core.config.settings.SMTP_HOST", "smtp.example.com"),
        patch("app.core.config.settings.EMAILS_FROM_EMAIL", "noreply@example.com"),
    ):
        sender = random_email()
        r = send(client, username, email=sender, message="<b>Hi</b> there, let's talk!")
        assert r.status_code == 200
    mail.assert_called_once()
    kwargs = mail.call_args.kwargs
    assert kwargs["reply_to"] == sender
    # Visitor text is escaped in the HTML email
    assert "&lt;b&gt;Hi&lt;/b&gt;" in kwargs["html_content"]
    assert "<b>Hi</b>" not in kwargs["html_content"]


def test_inbox_is_private_to_the_recipient(client: TestClient, db: Session) -> None:
    username, owner = published_creator(client, db)
    send(client, username)
    inquiry_id = inbox(client, owner)["data"][0]["id"]

    _, stranger = create_random_user_with_headers(client, db)
    assert inbox(client, stranger)["count"] == 0
    url = f"{API}/inquiries/{inquiry_id}"
    assert (
        client.patch(url, headers=stranger, json={"status": "read"}).status_code == 404
    )
    assert client.delete(url, headers=stranger).status_code == 404
    convert = client.post(f"{url}/convert", headers=workspace_headers(client, stranger))
    assert convert.status_code == 404


def test_mark_read_archive_filter_and_delete(client: TestClient, db: Session) -> None:
    username, headers = published_creator(client, db)
    send(client, username)
    send(client, username)
    first, second = (i["id"] for i in inbox(client, headers)["data"])

    r = client.patch(
        f"{API}/inquiries/{first}", headers=headers, json={"status": "read"}
    )
    assert r.status_code == 200
    assert r.json()["status"] == "read"
    client.patch(
        f"{API}/inquiries/{second}", headers=headers, json={"status": "archived"}
    )

    assert inbox(client, headers)["unread_count"] == 0
    assert [i["id"] for i in inbox(client, headers, status="archived")["data"]] == [
        second
    ]
    # "converted" can only be reached through the convert endpoint
    bad = client.patch(
        f"{API}/inquiries/{first}", headers=headers, json={"status": "converted"}
    )
    assert bad.status_code == 422

    assert client.delete(f"{API}/inquiries/{first}", headers=headers).status_code == 200
    assert inbox(client, headers)["count"] == 1


def test_convert_creates_brand_and_project_once(
    client: TestClient, db: Session
) -> None:
    username, headers = published_creator(client, db)
    ws = workspace_headers(client, headers)
    email = random_email()
    send(client, username, email=email.upper())
    send(client, username, email=email, company="Acme")
    first, second = (i["id"] for i in inbox(client, headers)["data"])

    r = client.post(f"{API}/inquiries/{first}/convert", headers=ws)
    assert r.status_code == 200
    project = r.json()
    assert project["title"] == "Inquiry from Acme"
    assert project["platform_status"] == "Planning"
    assert project["workspace_id"] == ws["X-Workspace-Id"]

    converted = inbox(client, headers, status="converted")["data"][0]
    assert converted["project_id"] == project["id"]
    assert converted["brand_id"] == project["brand_id"]

    # Same sender again (email compared case-insensitively): brand is reused
    r2 = client.post(f"{API}/inquiries/{second}/convert", headers=ws)
    assert r2.status_code == 200
    assert r2.json()["brand_id"] == project["brand_id"]
    brands = client.get(f"{API}/brands/", headers=ws).json()
    assert brands["count"] == 1

    again = client.post(f"{API}/inquiries/{first}/convert", headers=ws)
    assert again.status_code == 400


def test_convert_needs_workspace_header(client: TestClient, db: Session) -> None:
    username, headers = published_creator(client, db)
    send(client, username)
    inquiry_id = inbox(client, headers)["data"][0]["id"]
    r = client.post(f"{API}/inquiries/{inquiry_id}/convert", headers=headers)
    assert r.status_code == 422
