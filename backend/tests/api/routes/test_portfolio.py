import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models import User
from tests.utils.user import create_random_user_with_headers
from tests.utils.utils import random_lower_string
from tests.utils.workspace import workspace_headers

API = settings.API_V1_STR

CREATOR_KEYS = {
    "username",
    "full_name",
    "avatar_url",
    "cover_image_url",
    "headline",
    "location",
    "languages",
    "about",
    "bio",
    "niches",
    "content_formats",
    "platforms",
    "services",
    "availability",
    "media_kit_url",
    "accent_color",
    "website",
    "twitter",
    "instagram",
    "youtube",
    "tiktok",
    "contact_email",
    "member_since",
    "stats",
    "brands",
    "projects",
    "projects_total",
    "theme",
    "color_mode",
    "work_steps",
    "work_principles",
    "work_tools",
}
BRAND_KEYS = {"id", "name", "category"}
PROJECT_KEYS = {
    "id",
    "title",
    "type",
    "description",
    "is_featured",
    "brand_name",
    "live_url",
    "thumbnail_url",
    "tags",
}
PRIVATE_KEYS = {
    "notes",
    "contact_name",
    "owner_id",
    "workspace_id",
    "status",
    "platform_status",
    "deadline",
    "created_at",
    "brand_id",
    "email",
    "id_user",
    "hashed_password",
}


def published_creator(
    client: TestClient, db: Session, **profile
) -> tuple[str, dict, dict]:
    """A published creator; returns (username, auth headers, workspace headers)."""
    _, headers = create_random_user_with_headers(client, db)
    username = random_lower_string()[:20]
    r = client.patch(
        f"{API}/users/me",
        headers=headers,
        json={"username": username, "is_published": True, **profile},
    )
    assert r.status_code == 200, r.text
    return username, headers, workspace_headers(client, headers)


def make_brand(client: TestClient, ws: dict, name: str, **extra) -> str:
    r = client.post(
        f"{API}/brands/", headers=ws, json={"name": name, "category": "Tech", **extra}
    )
    assert r.status_code == 200, r.text
    return r.json()["id"]


def make_project(client: TestClient, ws: dict, title: str, **extra) -> dict:
    r = client.post(f"{API}/projects/", headers=ws, json={"title": title, **extra})
    assert r.status_code == 200, r.text
    return r.json()


def get_public(client: TestClient, username: str) -> dict:
    r = client.get(f"{API}/public/{username}")
    assert r.status_code == 200, r.text
    return r.json()


FULL_PROFILE = {
    "headline": "Tech YouTuber",
    "location": "Dhaka, Bangladesh",
    "languages": ["English", "Bangla"],
    "about": "I make honest gadget reviews.\nTwo videos a week.",
    "niches": ["Tech", "Gadgets"],
    "content_formats": ["Long videos", "Shorts"],
    "platforms": ["YouTube", "Instagram"],
    "services": [{"title": "Sponsored video", "description": "60-90s integration"}],
    "availability": "open",
    "media_kit_url": "https://example.com/kit.pdf",
    "cover_image_url": "https://example.com/cover.jpg",
    "accent_color": "sunset",
    "website": "https://example.com",
    "avatar_url": "https://example.com/me.png",
}


def test_portfolio_fields_round_trip(client: TestClient, db: Session) -> None:
    username, headers, _ = published_creator(client, db, **FULL_PROFILE)

    me = client.get(f"{API}/users/me", headers=headers).json()
    for key, value in FULL_PROFILE.items():
        assert me[key] == value, key

    data = get_public(client, username)
    for key, value in FULL_PROFILE.items():
        assert data[key] == value, key


def test_omitted_unchanged_empty_list_clears_null_rejected(
    client: TestClient, db: Session
) -> None:
    username, headers, _ = published_creator(client, db, **FULL_PROFILE)

    # omitting a field leaves it unchanged
    client.patch(f"{API}/users/me", headers=headers, json={"headline": "New headline"})
    data = get_public(client, username)
    assert data["headline"] == "New headline"
    assert data["niches"] == ["Tech", "Gadgets"]

    # [] clears a list, null clears a string
    r = client.patch(
        f"{API}/users/me", headers=headers, json={"niches": [], "location": None}
    )
    assert r.status_code == 200
    data = get_public(client, username)
    assert data["niches"] == [] and data["location"] is None

    # null on a list is rejected
    r = client.patch(f"{API}/users/me", headers=headers, json={"niches": None})
    assert r.status_code == 422


def test_lists_are_trimmed_and_deduplicated(client: TestClient, db: Session) -> None:
    username, headers, _ = published_creator(client, db)
    client.patch(
        f"{API}/users/me",
        headers=headers,
        json={
            "niches": ["  Tech ", "tech", "", "Beauty"],
            "services": [{"title": "UGC"}, {"title": "ugc"}],
            "headline": "   ",
        },
    )
    data = get_public(client, username)
    assert data["niches"] == ["Tech", "Beauty"]
    assert [s["title"] for s in data["services"]] == ["UGC"]
    assert data["headline"] is None


@pytest.mark.parametrize(
    "payload",
    [
        {"website": "javascript:alert(1)"},
        {"avatar_url": "data:text/html,<script>1</script>"},
        {"media_kit_url": "ftp://example.com/kit.pdf"},
        {"cover_image_url": "//evil.example/x.png"},
        {"cover_image_url": "https://exa mple.com/x.png"},
        {"cover_image_url": "https://example.com/" + "a" * 2100},
        {"niches": ["x"] * 11},
        {"niches": ["x" * 31]},
        {"languages": ["a"] * 9},
        {"platforms": ["Snapchat"]},
        {"platforms": ["YouTube"] * 11},
        {"services": [{"title": "x"}] * 9},
        {"services": [{"title": ""}]},
        {"about": "x" * 2001},
        {"headline": "x" * 121},
        {"availability": "busy"},
        {"accent_color": "pink"},
    ],
)
def test_invalid_portfolio_values_are_rejected(
    client: TestClient, db: Session, payload: dict
) -> None:
    _, headers = create_random_user_with_headers(client, db)
    r = client.patch(f"{API}/users/me", headers=headers, json=payload)
    assert r.status_code == 422, payload


def test_bare_domain_is_normalised_to_https(client: TestClient, db: Session) -> None:
    username, headers, _ = published_creator(client, db, website="example.com/me")
    assert get_public(client, username)["website"] == "https://example.com/me"


def test_public_response_has_exactly_the_expected_keys(
    client: TestClient, db: Session
) -> None:
    username, _, ws = published_creator(client, db, **FULL_PROFILE)
    brand = make_brand(
        client,
        ws,
        "Brand One",
        notes="private note",
        contact_name="Pat",
        contact_email="pat@brand.example",
    )
    make_project(
        client,
        ws,
        "Launch",
        platform_status="Published",
        brand_id=brand,
        deadline="2026-12-01",
        live_url="https://example.com/v",
        tags=["a"],
    )

    data = get_public(client, username)
    assert set(data) == CREATOR_KEYS
    assert set(data["brands"][0]) == BRAND_KEYS
    assert set(data["projects"][0]) == PROJECT_KEYS

    flat = repr(data)
    for private in ("private note", "pat@brand.example", "Pat"):
        assert private not in flat
    for obj in (data, data["brands"][0], data["projects"][0]):
        assert not (PRIVATE_KEYS & set(obj))


def test_only_published_projects_are_public_featured_first(
    client: TestClient, db: Session
) -> None:
    username, _, ws = published_creator(client, db)
    make_project(client, ws, "Plan", platform_status="Planning")
    make_project(client, ws, "Doing", platform_status="In Progress")
    make_project(client, ws, "Dropped", platform_status="Cancelled")
    make_project(client, ws, "Plain", platform_status="Published")
    make_project(client, ws, "Star", platform_status="Published", is_featured=True)

    data = get_public(client, username)
    assert [p["title"] for p in data["projects"]] == ["Star", "Plain"]
    assert data["projects"][0]["is_featured"] is True
    assert data["projects_total"] == 2
    assert data["stats"]["projects_count"] == 2


def test_brands_only_listed_when_tied_to_a_published_project(
    client: TestClient, db: Session
) -> None:
    username, _, ws = published_creator(client, db)
    shown = make_brand(client, ws, "Shown Co")
    inactive = make_brand(client, ws, "Past Co", status="inactive")
    lead = make_brand(client, ws, "Lead Co")
    make_brand(client, ws, "Unused Co")
    make_project(client, ws, "Done", platform_status="Published", brand_id=shown)
    make_project(client, ws, "Old", platform_status="Published", brand_id=inactive)
    make_project(client, ws, "Pitch", platform_status="Planning", brand_id=lead)

    data = get_public(client, username)
    assert [b["name"] for b in data["brands"]] == ["Past Co", "Shown Co"]
    assert data["stats"]["brands_count"] == 2
    by_title = {p["title"]: p for p in data["projects"]}
    assert by_title["Done"]["brand_name"] == "Shown Co"


def test_project_cannot_link_another_workspaces_brand(
    client: TestClient, db: Session
) -> None:
    _, _, ws_a = published_creator(client, db)
    _, _, ws_b = published_creator(client, db)
    foreign_brand = make_brand(client, ws_b, "Secret Co")

    r = client.post(
        f"{API}/projects/", headers=ws_a, json={"title": "X", "brand_id": foreign_brand}
    )
    assert r.status_code == 404
    mine = make_project(client, ws_a, "Mine")
    r = client.put(
        f"{API}/projects/{mine['id']}", headers=ws_a, json={"brand_id": foreign_brand}
    )
    assert r.status_code == 404


def test_project_url_and_tag_validation(client: TestClient, db: Session) -> None:
    _, _, ws = published_creator(client, db)
    bad = client.post(
        f"{API}/projects/",
        headers=ws,
        json={"title": "X", "live_url": "javascript:alert(1)"},
    )
    assert bad.status_code == 422
    bad = client.post(
        f"{API}/projects/", headers=ws, json={"title": "X", "thumbnail_url": "data:x"}
    )
    assert bad.status_code == 422
    bad = client.post(
        f"{API}/projects/", headers=ws, json={"title": "X", "tags": ["t"] * 7}
    )
    assert bad.status_code == 422
    ok = make_project(
        client, ws, "Y", tags=[" a ", "A", "b"], live_url="https://example.com"
    )
    assert ok["tags"] == ["a", "b"]


def test_old_public_endpoints_are_gone(client: TestClient, db: Session) -> None:
    username, _, _ = published_creator(client, db)
    assert client.get(f"{API}/public/{username}/brands").status_code == 404
    assert client.get(f"{API}/public/{username}/projects").status_code == 404


def test_public_response_is_cacheable_but_404_is_not(
    client: TestClient, db: Session
) -> None:
    username, _, _ = published_creator(client, db)
    ok = client.get(f"{API}/public/{username}")
    assert "max-age=30" in ok.headers["cache-control"]
    missing = client.get(f"{API}/public/does-not-exist-{username}")
    assert missing.status_code == 404
    assert "max-age" not in missing.headers.get("cache-control", "")


WORK_STYLE = {
    "work_steps": [
        {"title": "Discover", "description": "A call to understand the brief"},
        {"title": "Script", "description": None},
        {"title": "Shoot and edit", "description": "Two revision rounds included"},
    ],
    "work_principles": ["Honest reviews", "Clear timelines"],
    "work_tools": ["Premiere Pro", "Figma"],
}


def test_theme_and_work_style_default_to_empty(client: TestClient, db: Session) -> None:
    username, _, _ = published_creator(client, db)
    data = get_public(client, username)
    assert data["theme"] is None and data["color_mode"] is None
    assert (
        data["work_steps"] == []
        and data["work_principles"] == []
        and data["work_tools"] == []
    )


def test_theme_color_mode_and_work_style_round_trip(
    client: TestClient, db: Session
) -> None:
    username, headers, _ = published_creator(
        client,
        db,
        theme="editorial",
        color_mode="dark",
        accent_color="rose",
        **WORK_STYLE,
    )
    me = client.get(f"{API}/users/me", headers=headers).json()
    assert me["theme"] == "editorial" and me["color_mode"] == "dark"
    data = get_public(client, username)
    assert data["theme"] == "editorial" and data["color_mode"] == "dark"
    assert data["work_steps"] == WORK_STYLE["work_steps"]  # order is preserved
    assert data["work_principles"] == WORK_STYLE["work_principles"]
    assert data["work_tools"] == WORK_STYLE["work_tools"]


def test_theme_can_be_cleared_back_to_default(client: TestClient, db: Session) -> None:
    username, headers, _ = published_creator(
        client, db, theme="mono", color_mode="light"
    )
    client.patch(
        f"{API}/users/me", headers=headers, json={"theme": None, "color_mode": None}
    )
    data = get_public(client, username)
    assert data["theme"] is None and data["color_mode"] is None


def test_work_steps_are_deduplicated_and_trimmed(
    client: TestClient, db: Session
) -> None:
    username, headers, _ = published_creator(client, db)
    client.patch(
        f"{API}/users/me",
        headers=headers,
        json={
            "work_steps": [
                {"title": " Plan "},
                {"title": "plan"},
                {"title": "Film", "description": "  "},
            ],
            "work_principles": [" Calm ", "calm"],
        },
    )
    data = get_public(client, username)
    assert data["work_steps"] == [
        {"title": "Plan", "description": None},
        {"title": "Film", "description": None},
    ]
    assert data["work_principles"] == ["Calm"]


@pytest.mark.parametrize(
    "payload",
    [
        {"theme": "neon"},
        {"theme": "Studio"},
        {"color_mode": "auto"},
        {"work_steps": [{"title": ""}]},
        {"work_steps": [{"title": str(i)} for i in range(7)]},
        {"work_steps": [{"title": "x", "description": "y" * 241}]},
        {"work_steps": [{"title": "x" * 61}]},
        {"work_steps": None},
        {"work_principles": ["x" * 41]},
        {"work_principles": [str(i) for i in range(7)]},
        {"work_tools": [str(i) for i in range(13)]},
        {"work_tools": None},
    ],
)
def test_invalid_theme_and_work_style_values_are_rejected(
    client: TestClient, db: Session, payload: dict
) -> None:
    _, headers = create_random_user_with_headers(client, db)
    assert (
        client.patch(f"{API}/users/me", headers=headers, json=payload).status_code
        == 422
    ), payload


def test_omitting_work_style_leaves_it_unchanged(
    client: TestClient, db: Session
) -> None:
    username, headers, _ = published_creator(client, db, theme="soft", **WORK_STYLE)
    client.patch(f"{API}/users/me", headers=headers, json={"headline": "Hello"})
    data = get_public(client, username)
    assert data["theme"] == "soft" and data["work_steps"] == WORK_STYLE["work_steps"]
    client.patch(
        f"{API}/users/me", headers=headers, json={"work_steps": [], "work_tools": []}
    )
    data = get_public(client, username)
    assert data["work_steps"] == [] and data["work_tools"] == []
    assert data["work_principles"] == WORK_STYLE["work_principles"]


def test_legacy_junk_in_theme_and_work_style_is_neutralised(
    client: TestClient, db: Session
) -> None:
    """Rows written outside the API (old data, manual edits) must never break or leak."""
    username, _, _ = published_creator(client, db)
    user = db.exec(select(User).where(User.username == username)).one()
    user.theme = "hacked"
    user.color_mode = "purple"
    user.work_steps = [
        {"x": 1},
        "junk",
        {"title": 5},
        {"title": "Keep", "description": ["not text"]},
        {"title": "Fine", "description": "ok", "secret": "do not return"},
    ]
    user.work_principles = ["good", 3, None]
    user.work_tools = [{"a": 1}, "Figma"]
    db.add(user)
    db.commit()

    try:
        data = get_public(client, username)
        assert data["theme"] is None and data["color_mode"] is None
        assert data["work_steps"] == [
            {"title": "Keep", "description": None},
            {"title": "Fine", "description": "ok"},
        ]
        assert data["work_principles"] == ["good"] and data["work_tools"] == ["Figma"]
        assert "do not return" not in repr(data)
    finally:
        # The test database is shared: leave no malformed row behind for other tests
        user.theme = None
        user.color_mode = None
        user.work_steps = []
        user.work_principles = []
        user.work_tools = []
        db.add(user)
        db.commit()
