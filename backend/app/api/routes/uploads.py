from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import SQLModel

from app.api.deps import CurrentUser
from app.core import storage
from app.core.config import settings
from app.core.media import new_media_path
from app.core.rate_limit import rate_limit
from app.domain.images import ImageError, Kind, process_image

router = APIRouter(prefix="/uploads", tags=["uploads"])


class UploadedImage(SQLModel):
    # Site-relative path, e.g. /media/images/<owner>/<id>.webp. Save it in
    # avatar_url, cover_image_url or a project's thumbnail_url.
    url: str
    width: int
    height: int


@router.post(
    "/images",
    response_model=UploadedImage,
    dependencies=[Depends(rate_limit("upload", 60, 600))],
)
def upload_image(
    current_user: CurrentUser,
    file: Annotated[UploadFile, File()],
    kind: Annotated[Kind, Form()] = "thumbnail",
) -> Any:
    """Upload an avatar, cover or project thumbnail. Returns the stored image's path."""
    if not settings.media_enabled:
        raise HTTPException(status_code=503, detail="Image uploads are not available")

    max_bytes = settings.MEDIA_MAX_UPLOAD_MB * 1024 * 1024
    data = file.file.read(max_bytes + 1)  # never buffer more than the limit
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Image is too large (maximum {settings.MEDIA_MAX_UPLOAD_MB} MB)",
        )
    if not data:
        raise HTTPException(status_code=400, detail="The file is empty")

    try:
        webp, width, height = process_image(data, kind)
    except ImageError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail) from None

    path = new_media_path(current_user.id)
    try:
        storage.put_image(path, webp)
    except storage.StorageUnavailable:
        raise HTTPException(
            status_code=503, detail="Image storage is unavailable"
        ) from None
    return UploadedImage(url=path, width=width, height=height)
