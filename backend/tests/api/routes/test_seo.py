import io

from fastapi.testclient import TestClient
from PIL import Image
from sqlmodel import Session

from app.core.config import settings
from tests.utils.user import create_random_user_with_headers
from tests.utils.utils import random_lower_string

API = f"{settings.API_V1_STR}/seo"


def make_creator(
    client: TestClient, db: Session, *, published: bool = True, **profile: str
) -> str:
    _, headers = create_random_user_with_headers(client, db)
    username = random_lower_string()[:20]
    r = client.patch(
        f"{settings.API_V1_STR}/users/me",
        headers=headers,
        json={"username": username, "is_published": published, **profile},
    )
    assert r.status_code == 200, r.text
    return username


def test_profile_meta_has_creator_tags(client: TestClient, db: Session) -> None:
    username = make_creator(
        client, db, full_name="Alex Rivera", headline="Tech reviewer"
    )
    r = client.get(f"{API}/profile-meta/{username}")
    assert r.status_code == 200
    body = r.text
    assert "<title>Alex Rivera – Tech reviewer | CreatorHandle</title>" in body
    assert f'content="{settings.FRONTEND_HOST}/@{username}"' in body
    assert f"/seo/og/{username}.png" in body
    assert 'content="summary_large_image"' in body
    assert "noindex" not in body


def test_profile_meta_escapes_html_and_template_braces(
    client: TestClient, db: Session
) -> None:
    username = make_creator(
        client, db, full_name='Eve "<script>"', headline="{{ .Req }} hi"
    )
    body = client.get(f"{API}/profile-meta/{username}").text
    assert "<script>" not in body
    assert "{{" not in body and "}}" not in body
    assert "&lt;script&gt;" in body
    assert "&#123;&#123; .Req &#125;&#125;" in body


def test_unknown_or_unpublished_profile_gets_generic_noindex_tags(
    client: TestClient, db: Session
) -> None:
    hidden = make_creator(client, db, published=False, full_name="Hidden Person")
    for username in (hidden, "nobody-" + random_lower_string()[:8]):
        r = client.get(f"{API}/profile-meta/{username}")
        assert r.status_code == 200
        assert 'name="robots" content="noindex"' in r.text
        assert "Hidden Person" not in r.text


def test_share_image_is_a_1200x630_png(client: TestClient, db: Session) -> None:
    username = make_creator(client, db, full_name="Pat Doe", accent_color="aurora")
    r = client.get(f"{API}/og/{username}.png")
    assert r.status_code == 200
    assert r.headers["content-type"] == "image/png"
    assert Image.open(io.BytesIO(r.content)).size == (1200, 630)

    hidden = make_creator(client, db, published=False)
    assert client.get(f"{API}/og/{hidden}.png").status_code == 404


def test_sitemap_lists_only_published_profiles(client: TestClient, db: Session) -> None:
    shown = make_creator(client, db)
    hidden = make_creator(client, db, published=False)
    r = client.get(f"{API}/sitemap.xml")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/xml")
    assert f"{settings.FRONTEND_HOST}/@{shown}</loc>" in r.text
    assert f"/@{hidden}<" not in r.text


def test_robots_points_at_sitemap_and_blocks_non_production(
    client: TestClient,
) -> None:
    r = client.get(f"{API}/robots.txt")
    assert r.status_code == 200
    assert f"Sitemap: {settings.FRONTEND_HOST}/sitemap.xml" in r.text
    if settings.ENVIRONMENT != "production":
        assert "Disallow: /\n" in r.text


def test_seo_routes_are_not_in_the_api_schema(client: TestClient) -> None:
    paths = client.get(f"{settings.API_V1_STR}/openapi.json").json()["paths"]
    assert not [p for p in paths if "/seo/" in p]
