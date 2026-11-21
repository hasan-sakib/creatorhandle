"""Crawler-facing endpoints: per-creator meta tags, share image, sitemap, robots.

The public site is a single-page app, so link previews (Slack, X, iMessage,
LinkedIn...) and crawlers that don't run JavaScript would only ever see the
generic homepage tags. Caddy fills them in instead: for /@username it serves
the site's index.html through its `templates` handler, which includes
GET /api/v1/seo/profile-meta/{username} in place of the default tags.

None of this is part of the JSON API, so it stays out of the OpenAPI schema
(and the generated clients).
"""

import html
from typing import Any
from urllib.parse import urlsplit

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, PlainTextResponse, Response
from sqlmodel import col, select

from app.api.deps import SessionDep
from app.core import storage
from app.core.config import settings
from app.core.media import is_media_path
from app.domain.og_image import render_profile_image
from app.models import User

router = APIRouter(prefix="/seo", tags=["seo"], include_in_schema=False)

SITE_NAME = "CreatorHandle"
DEFAULT_TITLE = "CreatorHandle — Run your creator business, share it with one link"
DEFAULT_DESCRIPTION = (
    "Brands, projects and tasks in one workspace, plus a public page at /@yourhandle."
)
MAX_DESCRIPTION = 200
SITEMAP_LIMIT = 50_000


def _attr(value: str) -> str:
    """Escape for an HTML attribute or text node.

    Caddy renders the included snippet as a template too, so braces are
    escaped as well: visitor-controlled text must never reach the template
    engine as `{{ ... }}`.
    """
    return html.escape(value, quote=True).replace("{", "&#123;").replace("}", "&#125;")


def _site_url() -> str:
    return settings.FRONTEND_HOST.rstrip("/")


def _published(session: SessionDep, username: str) -> User | None:
    return session.exec(
        select(User).where(User.username == username, User.is_published)
    ).first()


def _description(user: User) -> str:
    for text in (user.headline, user.bio, user.about):
        if text and text.strip():
            flat = " ".join(text.split())
            return (
                flat
                if len(flat) <= MAX_DESCRIPTION
                else flat[: MAX_DESCRIPTION - 1].rstrip() + "…"
            )
    name = user.full_name or f"@{user.username}"
    return f"{name}'s portfolio, services and work on {SITE_NAME}."


def _tags(pairs: list[tuple[str, str, str]], title: str) -> str:
    lines = [f"<title>{_attr(title)}</title>"]
    for kind, key, value in pairs:
        if kind == "link":
            lines.append(f'<link rel="{key}" href="{_attr(value)}" />')
        else:
            lines.append(f'<meta {kind}="{key}" content="{_attr(value)}" />')
    return "\n    ".join(lines) + "\n"


@router.get("/profile-meta/{username}", response_class=HTMLResponse)
def profile_meta(session: SessionDep, username: str) -> Any:
    """<head> tags for /@username. Always 200 (Caddy includes the body as is);
    unknown or unpublished pages get the generic tags plus noindex."""
    user = _published(session, username)
    if user is None:
        body = _tags(
            [
                ("name", "description", DEFAULT_DESCRIPTION),
                ("name", "robots", "noindex"),
                ("property", "og:type", "website"),
                ("property", "og:site_name", SITE_NAME),
                ("property", "og:title", DEFAULT_TITLE),
                ("property", "og:description", DEFAULT_DESCRIPTION),
                ("name", "twitter:card", "summary"),
            ],
            DEFAULT_TITLE,
        )
        return HTMLResponse(body)

    handle = user.username or username
    name = user.full_name or f"@{handle}"
    title = f"{name}{f' – {user.headline}' if user.headline else ''} | {SITE_NAME}"
    description = _description(user)
    url = f"{_site_url()}/@{handle}"
    image = f"{_site_url()}{settings.API_V1_STR}/seo/og/{handle}.png"
    body = _tags(
        [
            ("name", "description", description),
            ("link", "canonical", url),
            ("property", "og:type", "profile"),
            ("property", "og:site_name", SITE_NAME),
            ("property", "og:title", name),
            ("property", "og:description", description),
            ("property", "og:url", url),
            ("property", "og:image", image),
            ("property", "og:image:width", "1200"),
            ("property", "og:image:height", "630"),
            ("property", "og:image:alt", f"{name} on {SITE_NAME}"),
            ("property", "profile:username", handle),
            ("name", "twitter:card", "summary_large_image"),
            ("name", "twitter:title", name),
            ("name", "twitter:description", description),
            ("name", "twitter:image", image),
        ],
        title,
    )
    return HTMLResponse(body, headers={"Cache-Control": "public, max-age=60"})


@router.get("/og/{username}.png")
def profile_image(session: SessionDep, username: str) -> Response:
    user = _published(session, username)
    if user is None:
        raise HTTPException(status_code=404, detail="Creator not found")
    handle = user.username or username
    avatar = None
    if settings.media_enabled and is_media_path(user.avatar_url):
        avatar = storage.get_image(user.avatar_url or "")
    png = render_profile_image(
        name=user.full_name or f"@{handle}",
        headline=user.headline,
        handle=handle,
        site=urlsplit(_site_url()).netloc or SITE_NAME,
        accent=user.accent_color,
        avatar=avatar,
    )
    return Response(
        png,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/sitemap.xml")
def sitemap(session: SessionDep) -> Response:
    handles = session.exec(
        select(User.username)
        .where(User.is_published, col(User.username).is_not(None))
        .order_by(col(User.created_at))
        .limit(SITEMAP_LIMIT - 1)
    ).all()
    site = _site_url()
    urls = [f"{site}/"] + [f"{site}/@{h}" for h in handles if h]
    body = "".join(f"<url><loc>{html.escape(u)}</loc></url>" for u in urls)
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f"{body}</urlset>"
    )
    return Response(
        xml,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/robots.txt", response_class=PlainTextResponse)
def robots() -> str:
    lines = ["User-agent: *", "Allow: /", "Disallow: /app/", "Disallow: /api/"]
    if settings.ENVIRONMENT != "production":
        # Keep staging and local stacks out of search results
        lines = ["User-agent: *", "Disallow: /"]
    return "\n".join([*lines, f"Sitemap: {_site_url()}/sitemap.xml", ""])
