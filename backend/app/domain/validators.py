"""Reusable validated types for user-editable portfolio fields.

These are used on *write* models only (UserUpdateMe, ProjectCreate/Update).
Read models and table models stay permissive so legacy rows can never make a
response fail validation.
"""

import re
from collections.abc import Callable
from typing import Annotated, Any, Literal
from urllib.parse import urlparse

from pydantic import AfterValidator, BaseModel, Field as PydanticField

from app.core.media import is_media_path

# Keys of the dashboard accent presets (frontend/creator-workspace
# components/accent-color-provider.tsx). null means the default teal.
AccentKey = Literal[
    "teal",
    "indigo",
    "violet",
    "rose",
    "orange",
    "green",
    "sky",
    "slate",
    "sunset",
    "aurora",
]

Availability = Literal["open", "limited", "closed"]

# Look of the public portfolio page. Keep in sync with
# frontend/creator-site/src/lib/themes.ts and
# frontend/creator-workspace/src/lib/themePresets.ts.
ThemeKey = Literal["studio", "editorial", "aurora", "bold", "soft", "mono"]

# The creator's default light/dark choice for their page (visitors can still switch)
ColorMode = Literal["light", "dark", "system"]

Platform = Literal[
    "YouTube",
    "TikTok",
    "Instagram",
    "Twitch",
    "X",
    "LinkedIn",
    "Podcast",
    "Blog",
    "Other",
]

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_WHITESPACE = re.compile(r"\s")


def _clean_text(value: str | None) -> str | None:
    """Strip, turn blank into None, reject control characters."""
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    if _CONTROL_CHARS.search(value):
        raise ValueError("must not contain control characters")
    return value


def _clean_url(value: str | None) -> str | None:
    """Only absolute http(s) URLs with a host are allowed.

    A bare "example.com/path" is accepted and normalised to https://.
    Anything with another scheme (javascript:, data:, ftp:, ...) is rejected.
    """
    value = _clean_text(value)
    if value is None:
        return None
    if _WHITESPACE.search(value):
        raise ValueError("must not contain whitespace")
    if "://" not in value and ":" not in value and not value.startswith("/"):
        value = f"https://{value}"
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("must be an http(s) URL")
    return value


def _clean_image_url(value: str | None) -> str | None:
    """An uploaded image (our own /media/ path) or an absolute http(s) URL."""
    value = _clean_text(value)
    if value is None:
        return None
    if is_media_path(value):
        return value
    return _clean_url(value)


def _clean_tags(max_len: int) -> Callable[[list[str]], list[str]]:
    def _clean(items: list[str]) -> list[str]:
        seen: set[str] = set()
        out: list[str] = []
        for item in items:
            cleaned = _clean_text(item)
            if cleaned is None:
                continue
            if len(cleaned) > max_len:
                raise ValueError(f"each item must be at most {max_len} characters")
            key = cleaned.casefold()
            if key in seen:
                continue
            seen.add(key)
            out.append(cleaned)
        return out

    return _clean


def tag_list(max_items: int, max_len: int = 30) -> Any:
    """A list of short, trimmed, de-duplicated strings. `null` is rejected; `[]` clears."""
    return Annotated[
        list[str],
        PydanticField(max_length=max_items),
        AfterValidator(_clean_tags(max_len)),
    ]


def text(max_length: int) -> Any:
    return Annotated[
        str | None, PydanticField(max_length=max_length), AfterValidator(_clean_text)
    ]


def url(max_length: int = 2048) -> Any:
    return Annotated[
        str | None, PydanticField(max_length=max_length), AfterValidator(_clean_url)
    ]


def image_url(max_length: int = 2048) -> Any:
    return Annotated[
        str | None,
        PydanticField(max_length=max_length),
        AfterValidator(_clean_image_url),
    ]


class ServiceItem(BaseModel):
    """One thing a creator offers to brands."""

    title: Annotated[
        str, PydanticField(min_length=1, max_length=60), AfterValidator(_clean_text)
    ]
    description: Annotated[
        str | None, PydanticField(max_length=200), AfterValidator(_clean_text)
    ] = None


class WorkStepItem(BaseModel):
    """One step of how a creator works (their process), in order."""

    title: Annotated[
        str, PydanticField(min_length=1, max_length=60), AfterValidator(_clean_text)
    ]
    description: Annotated[
        str | None, PydanticField(max_length=240), AfterValidator(_clean_text)
    ] = None


def _dedupe_by_title(items: list[Any]) -> list[Any]:
    """Keep the first item for each title (case-insensitive), preserving order."""
    seen: set[str] = set()
    out = []
    for item in items:
        key = item.title.casefold()
        if key not in seen:
            seen.add(key)
            out.append(item)
    return out


ServiceList = Annotated[
    list[ServiceItem],
    PydanticField(max_length=8),
    AfterValidator(_dedupe_by_title),
]

WorkStepList = Annotated[
    list[WorkStepItem],
    PydanticField(max_length=6),
    AfterValidator(_dedupe_by_title),
]

PlatformList = Annotated[
    list[Platform],
    PydanticField(max_length=10),
    AfterValidator(lambda items: list(dict.fromkeys(items))),
]
