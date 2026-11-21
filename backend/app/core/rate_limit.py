"""Small in-memory rate limiter for abuse-prone endpoints.

Sliding window per key, kept in process memory. With several workers each
one counts separately, so the effective limit is `limit * WEB_CONCURRENCY`;
that is fine for slowing down brute force and spam. Move the counters to
Redis or Postgres if exact limits ever matter.

The client IP comes from `request.client`, which uvicorn fills from
X-Forwarded-For when the proxy is trusted (FORWARDED_ALLOW_IPS in compose).
"""

import threading
import time
from collections import deque
from collections.abc import Callable

from fastapi import HTTPException, Request

from app.core.config import settings

_hits: dict[str, deque[float]] = {}
_lock = threading.Lock()
# Drop idle keys now and then so the dict doesn't grow forever
_SWEEP_EVERY = 1000
_calls = 0


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _sweep(now: float, max_window: float = 3600) -> None:
    for key in [k for k, q in _hits.items() if not q or now - q[-1] > max_window]:
        del _hits[key]


def enforce(key: str, limit: int, window_seconds: int) -> None:
    """Count one hit for `key`; raise 429 once it exceeds `limit` per window."""
    if not settings.RATE_LIMIT_ENABLED:
        return
    global _calls
    now = time.monotonic()
    with _lock:
        _calls += 1
        if _calls % _SWEEP_EVERY == 0:
            _sweep(now)
        hits = _hits.setdefault(key, deque())
        while hits and now - hits[0] >= window_seconds:
            hits.popleft()
        if len(hits) >= limit:
            retry_after = int(window_seconds - (now - hits[0])) + 1
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )
        hits.append(now)


def rate_limit(scope: str, limit: int, window_seconds: int) -> Callable[..., None]:
    """Dependency: at most `limit` requests per client IP per window."""

    def dependency(request: Request) -> None:
        enforce(f"{scope}:{client_ip(request)}", limit, window_seconds)

    return dependency


def reset() -> None:
    """Forget all counters (tests)."""
    with _lock:
        _hits.clear()
