# ---- builder: resolve and install dependencies into /app/.venv ----
FROM python:3.12-slim AS builder

# Install uv
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

# Compile bytecode, and copy (not hardlink) from the cache mount
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Dev dependencies (pytest, mypy, ruff, ...) are only installed for local
# development and test runs: INSTALL_DEV=true
ARG INSTALL_DEV=false

WORKDIR /app/

# Dependencies first, so this layer is cached until the lockfile changes
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-workspace --package app \
        $([ "$INSTALL_DEV" = "true" ] || echo --no-dev)

COPY ./backend/pyproject.toml ./backend/alembic.ini /app/backend/
COPY ./backend/app /app/backend/app
COPY ./backend/tests /app/backend/tests

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --package app \
        $([ "$INSTALL_DEV" = "true" ] || echo --no-dev)


# Tests only ship with the dev image
RUN [ "$INSTALL_DEV" = "true" ] || rm -rf /app/backend/tests


# ---- runtime: just the virtualenv and the app, no uv or build cache ----
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

# Unprivileged runtime user. UID 1000 matches the usual host user, so dev
# bind mounts (e.g. backend/htmlcov) stay writable on Linux.
RUN groupadd --system --gid 1000 app \
    && useradd --system --uid 1000 --gid app --create-home app

# The virtualenv stays root-owned (read-only for the app); the app dir is
# owned by app so tests can write coverage/pytest caches in the dev image.
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder --chown=app:app /app/backend /app/backend
COPY --chown=app:app ./backend/scripts /app/backend/scripts

WORKDIR /app/backend/

USER app

# Waits for the DB, runs migrations and seeds initial data, then starts the CMD
ENTRYPOINT ["bash", "scripts/entrypoint.sh"]

# Worker count comes from WEB_CONCURRENCY (set in compose)
CMD ["fastapi", "run", "app/main.py"]
