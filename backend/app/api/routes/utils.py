import logging
from typing import Literal

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from pydantic.networks import EmailStr
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from app.api.deps import SessionDep, get_current_active_superuser
from app.core import storage
from app.core.config import settings
from app.emails import generate_test_email, send_email
from app.models import Message

router = APIRouter(prefix="/utils", tags=["utils"])
logger = logging.getLogger(__name__)

CheckStatus = Literal["ok", "error", "disabled"]


class ReadinessChecks(BaseModel):
    database: CheckStatus
    storage: CheckStatus


class Readiness(BaseModel):
    status: Literal["ok", "error"]
    checks: ReadinessChecks


@router.post(
    "/test-email/",
    dependencies=[Depends(get_current_active_superuser)],
    status_code=201,
)
def test_email(email_to: EmailStr) -> Message:
    """
    Test emails.
    """
    email_data = generate_test_email(email_to=email_to)
    send_email(
        email_to=email_to,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Test email sent")


@router.get("/health-check/")
async def health_check() -> bool:
    """Liveness: the process is up and serving requests."""
    return True


@router.get(
    "/ready/",
    responses={503: {"model": Readiness, "description": "A dependency is down"}},
)
def readiness(session: SessionDep, response: Response) -> Readiness:
    """Readiness: the database (and object storage, when configured) respond."""
    database: CheckStatus = "ok"
    try:
        session.exec(select(1)).one()
    except SQLAlchemyError:
        logger.warning("Readiness: database check failed", exc_info=True)
        database = "error"

    storage_status: CheckStatus = "disabled"
    if settings.media_enabled:
        try:
            storage.check_bucket()
            storage_status = "ok"
        except storage.StorageUnavailable:
            logger.warning("Readiness: storage check failed", exc_info=True)
            storage_status = "error"

    ok = database != "error" and storage_status != "error"
    if not ok:
        response.status_code = 503
    return Readiness(
        status="ok" if ok else "error",
        checks=ReadinessChecks(database=database, storage=storage_status),
    )
