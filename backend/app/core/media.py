"""Rules for images uploaded to our own storage.

A stored image is referenced by a *site-relative path*:

    /media/images/<owner>/<random>.webp

`<owner>` is an HMAC of the uploader's id (not the id itself), so the public URL
never reveals an internal id, yet we can still check that someone only attaches
or deletes images they uploaded themselves. The path is the same in the bucket
(bucket "media", key "images/<owner>/<random>.webp") and on the site, where
Caddy proxies /media/* to storage, which keeps URLs portable across domains.
"""

import hashlib
import hmac
import re
import uuid

from app.core.config import settings

_BASE = f"/{settings.S3_BUCKET}/images/"
_PATH = re.compile(
    rf"^{re.escape(_BASE)}(?P<owner>[0-9a-f]{{16}})/[0-9a-f]{{32}}\.webp$"
)


def owner_prefix(user_id: uuid.UUID) -> str:
    digest = hmac.new(
        settings.SECRET_KEY.encode(), f"media:{user_id}".encode(), hashlib.sha256
    ).hexdigest()
    return digest[:16]


def is_media_path(value: str | None) -> bool:
    return bool(value and _PATH.match(value))


def owns_media(user_id: uuid.UUID, value: str | None) -> bool:
    match = _PATH.match(value or "")
    return bool(match and hmac.compare_digest(match["owner"], owner_prefix(user_id)))


def new_media_path(user_id: uuid.UUID) -> str:
    return f"{_BASE}{owner_prefix(user_id)}/{uuid.uuid4().hex}.webp"


def bucket_key(path: str) -> str:
    """'/media/images/x/y.webp' -> 'images/x/y.webp' (the key inside the bucket)."""
    return path[len(f"/{settings.S3_BUCKET}/") :]
