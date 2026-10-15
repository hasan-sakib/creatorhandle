"""Public portfolio endpoint.

The response schemas here are standalone on purpose: they do NOT inherit from
the table/base models, so a new private column can never leak by default.
Everything a visitor can see is listed explicitly below.
"""

from typing import Any, get_args

from fastapi import APIRouter, HTTPException, Response
from sqlmodel import SQLModel, col, func, select

from app.api.deps import SessionDep
from app.core.validators import (
    AccentKey,
    Availability,
    ColorMode,
    Platform,
    ThemeKey,
    _clean_image_url,
    _clean_url,
)
from app.models import Brand, Project, User

router = APIRouter(prefix="/public", tags=["public"])

MAX_PROJECTS = 60
MAX_BRANDS = 100
CACHE_CONTROL = "public, max-age=30, stale-while-revalidate=120"

_ACCENTS = set(get_args(AccentKey))
_AVAILABILITY = set(get_args(Availability))
_PLATFORMS = set(get_args(Platform))
_THEMES = set(get_args(ThemeKey))
_COLOR_MODES = set(get_args(ColorMode))


class PublicOffering(SQLModel):
    title: str
    description: str | None = None


class PublicWorkStep(SQLModel):
    title: str
    description: str | None = None


class PublicBrand(SQLModel):
    id: str
    name: str
    category: str


class PublicProject(SQLModel):
    id: str
    title: str
    type: str
    description: str | None = None
    is_featured: bool
    brand_name: str | None = None
    live_url: str | None = None
    thumbnail_url: str | None = None
    tags: list[str]


class PublicStats(SQLModel):
    brands_count: int
    projects_count: int


class PublicCreator(SQLModel):
    username: str
    full_name: str | None = None
    avatar_url: str | None = None
    cover_image_url: str | None = None
    headline: str | None = None
    location: str | None = None
    languages: list[str]
    about: str | None = None
    bio: str | None = None
    niches: list[str]
    content_formats: list[str]
    platforms: list[str]
    services: list[PublicOffering]
    availability: str | None = None
    media_kit_url: str | None = None
    accent_color: str | None = None
    theme: str | None = None
    color_mode: str | None = None
    work_steps: list[PublicWorkStep]
    work_principles: list[str]
    work_tools: list[str]
    website: str | None = None
    twitter: str | None = None
    instagram: str | None = None
    youtube: str | None = None
    tiktok: str | None = None
    contact_email: str | None = None
    member_since: str | None = None
    stats: PublicStats
    brands: list[PublicBrand]
    projects: list[PublicProject]
    projects_total: int


def _safe_url(value: str | None) -> str | None:
    """Defence in depth: legacy rows may hold unsafe or malformed URLs."""
    try:
        return _clean_url(value)
    except ValueError:
        return None


def _safe_image_url(value: str | None) -> str | None:
    try:
        return _clean_image_url(value)
    except ValueError:
        return None


def _strings(value: Any) -> list[str]:
    return [v for v in (value or []) if isinstance(v, str)]


def _titled_items(value: Any, model: type[SQLModel]) -> list[Any]:
    """Coerce stored {title, description} dicts; anything malformed is dropped."""
    out: list[Any] = []
    for item in value or []:
        if isinstance(item, dict) and isinstance(item.get("title"), str):
            description = item.get("description")
            out.append(
                model(
                    title=item["title"],
                    description=description if isinstance(description, str) else None,
                )
            )
    return out


def _get_user_by_username(session: SessionDep, username: str) -> User:
    user = session.exec(
        select(User).where(User.username == username, User.is_published)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Creator not found")
    return user


@router.get("/{username}", response_model=PublicCreator)
def get_creator(session: SessionDep, response: Response, username: str) -> Any:
    user = _get_user_by_username(session, username)

    published = (
        Project.owner_id == user.id,
        Project.platform_status == "Published",
    )

    projects_total = session.exec(
        select(func.count()).select_from(Project).where(*published)
    ).one()
    projects = session.exec(
        select(Project)
        .where(*published)
        .order_by(col(Project.is_featured).desc(), col(Project.created_at).desc(), Project.id)
        .limit(MAX_PROJECTS)
    ).all()

    # "Brands I've worked with": only brands tied to a published project, so
    # pipeline leads and inactive prospects are never exposed.
    public_brand_ids = (
        select(Project.brand_id)
        .where(*published, col(Project.brand_id).is_not(None))
        .distinct()
    )
    brand_filter = (Brand.owner_id == user.id, col(Brand.id).in_(public_brand_ids))
    brands_count = session.exec(
        select(func.count()).select_from(Brand).where(*brand_filter)
    ).one()
    brands = session.exec(
        select(Brand).where(*brand_filter).order_by(Brand.name).limit(MAX_BRANDS)
    ).all()
    brand_names = {b.id: b.name for b in brands}

    response.headers["Cache-Control"] = CACHE_CONTROL
    return PublicCreator(
        username=user.username or username,
        full_name=user.full_name,
        avatar_url=_safe_image_url(user.avatar_url),
        cover_image_url=_safe_image_url(user.cover_image_url),
        headline=user.headline,
        location=user.location,
        languages=_strings(user.languages),
        about=user.about,
        bio=user.bio,
        niches=_strings(user.niches),
        content_formats=_strings(user.content_formats),
        platforms=[p for p in _strings(user.platforms) if p in _PLATFORMS],
        services=_titled_items(user.services, PublicOffering),
        availability=user.availability if user.availability in _AVAILABILITY else None,
        media_kit_url=_safe_url(user.media_kit_url),
        accent_color=user.accent_color if user.accent_color in _ACCENTS else None,
        theme=user.theme if user.theme in _THEMES else None,
        color_mode=user.color_mode if user.color_mode in _COLOR_MODES else None,
        work_steps=_titled_items(user.work_steps, PublicWorkStep),
        work_principles=_strings(user.work_principles),
        work_tools=_strings(user.work_tools),
        website=_safe_url(user.website),
        twitter=user.twitter,
        instagram=user.instagram,
        youtube=user.youtube,
        tiktok=user.tiktok,
        contact_email=user.contact_email,
        member_since=user.created_at.isoformat() if user.created_at else None,
        stats=PublicStats(brands_count=brands_count, projects_count=projects_total),
        brands=[
            PublicBrand(id=str(b.id), name=b.name, category=b.category) for b in brands
        ],
        projects=[
            PublicProject(
                id=str(p.id),
                title=p.title,
                type=p.type,
                description=p.description,
                is_featured=p.is_featured,
                brand_name=brand_names.get(p.brand_id) if p.brand_id else None,
                live_url=_safe_url(p.live_url),
                thumbnail_url=_safe_image_url(p.thumbnail_url),
                tags=_strings(p.tags),
            )
            for p in projects
        ],
        projects_total=projects_total,
    )
