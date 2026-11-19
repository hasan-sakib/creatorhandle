"""Logging setup and request logging.

One call to configure_logging() at process start (app or CLI command) sets a
single stdout handler: readable text when ENVIRONMENT=local, JSON lines
everywhere else so a log shipper can parse them. Uvicorn's own loggers are
routed through the same handler; its access log is replaced by
log_requests(), which also tags every line with a request id.
"""

import json
import logging
import sys
import time
import uuid
from collections.abc import Awaitable, Callable
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any

from fastapi import Request, Response

from app.core.config import settings

request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)

# Fields passed via `extra=` that should appear in JSON output
_EXTRA_FIELDS = ("method", "path", "status", "duration_ms", "client")

# Polled by Docker/uptime checks every few seconds; logged at DEBUG only
_QUIET_PATHS = frozenset(
    {
        f"{settings.API_V1_STR}/utils/health-check/",
        f"{settings.API_V1_STR}/utils/ready/",
    }
)

logger = logging.getLogger("app.request")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        request_id = request_id_var.get()
        if request_id:
            payload["request_id"] = request_id
        for field in _EXTRA_FIELDS:
            if hasattr(record, field):
                payload[field] = getattr(record, field)
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    if settings.ENVIRONMENT == "local":
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)-7s %(name)s: %(message)s")
        )
    else:
        handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers[:] = [handler]
    root.setLevel(settings.LOG_LEVEL)

    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uvicorn_logger = logging.getLogger(name)
        uvicorn_logger.handlers[:] = []
        uvicorn_logger.propagate = True
    # Replaced by log_requests() below
    logging.getLogger("uvicorn.access").disabled = True


async def log_requests(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    """HTTP middleware: one log line per request, plus an X-Request-ID header."""
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
    token = request_id_var.set(request_id)
    try:
        return await _call_and_log(request, call_next, request_id)
    finally:
        request_id_var.reset(token)


async def _call_and_log(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
    request_id: str,
) -> Response:
    start = time.perf_counter()
    path = request.url.path
    extra: dict[str, Any] = {
        "method": request.method,
        "path": path,
        "client": request.client.host if request.client else None,
    }
    try:
        response = await call_next(request)
    except Exception:
        extra["duration_ms"] = round((time.perf_counter() - start) * 1000, 1)
        logger.exception("%s %s failed", request.method, path, extra=extra)
        raise

    duration_ms = round((time.perf_counter() - start) * 1000, 1)
    extra.update(status=response.status_code, duration_ms=duration_ms)
    level = logging.DEBUG if path in _QUIET_PATHS else logging.INFO
    logger.log(
        level,
        "%s %s %s %.1fms",
        request.method,
        path,
        response.status_code,
        duration_ms,
        extra=extra,
    )
    response.headers["X-Request-ID"] = request_id
    return response
