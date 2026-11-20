# CreatorHandle — Docker Setup

Compose files live at the repo root. Run commands from there; `compose.override.yml` (dev) is applied automatically. Most day-to-day commands are wrapped in the `Makefile` (`make help`).

The Compose project is named `creatorhandle`. The data volumes keep the names they had when these files lived in `deploy/` (`deploy_app-db-data`, `deploy_rustfs-data`, `deploy_caddy-data`, `deploy_caddy-config`), so existing data is reused.

## Compose Files

| File | Used For |
|---|---|
| `compose.yml` | Base stack definition (all environments) |
| `compose.override.yml` | Local dev overrides — adds live-reload, Mailcatcher, port mappings, dev dependencies |
| `compose.prod.yml` | Production additions: publishes ports 80/443 and sets the public domain (`docker compose -f compose.yml -f compose.prod.yml up -d --build`) |

## Common Commands

```bash
# Start full local stack (applies both compose.yml + compose.override.yml)
docker compose up -d

# Start with backend hot-reload (watches backend/ for changes)
docker compose watch

# View all logs
docker compose logs -f

# View logs for one service
docker compose logs backend -f

# Stop everything
docker compose down

# Stop and DELETE all data volumes (database, uploads, certificates) — irreversible
docker compose down -v

# Rebuild a specific image (e.g. after changing VITE_GOOGLE_CLIENT_ID)
docker compose build --no-cache frontend

# Production deploy (no dev overrides)
docker compose -f compose.yml -f compose.prod.yml up -d --build
```

## Services

| Service | Image | Port (local) | Description |
|---|---|---|---|
| `db` | postgres:18 | 5432 | PostgreSQL database |
| `backend` | `backend/Dockerfile` | 8000 | FastAPI application (runs migrations + seeds superuser on start); healthy when `/api/v1/utils/ready/` returns 200 |
| `frontend` | `frontend/Dockerfile` | 5173→80 | Caddy: serves both Vite apps, proxies `/api` to the backend, HTTPS in prod |
| `rustfs` | rustfs/rustfs | 9001 (console, dev only) | S3-compatible object storage for uploaded images (private network; Caddy serves `/media/*`) |
| `mailcatcher` | schickling/mailcatcher | 1025 (SMTP), 1080 (Web) | Catches all outbound email in dev |
| `playwright` | `frontend/Dockerfile.playwright` | 9323 | E2E test runner (on demand: `docker compose ... run --rm playwright`) |

## Local Dev URLs

| Service | URL |
|---|---|
| Marketing site | http://localhost:5173 |
| Dashboard | http://localhost:5173/app/ |
| Public creator profile | http://localhost:5173/@{username} |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Mailcatcher | http://localhost:1080 |

## Dockerfile Details

### `backend/Dockerfile`

- Multi-stage: a builder stage (`python:3.12-slim` + `uv`, with a cache mount and the lockfile installed before the source for layer caching) installs dependencies into a virtualenv, and the runtime stage (`python:3.12-slim`) copies only that virtualenv and the app. No `uv`, build cache or dev tools in the final image (~480 MB).
- Runs as the unprivileged `app` user (uid 1000). The virtualenv is root-owned and read-only to the app.
- `INSTALL_DEV` build arg (default `false`): `true` also installs the dev dependencies (pytest, ruff, mypy, ...) and ships `backend/tests`. `compose.override.yml` sets it.
- Entrypoint (`backend/scripts/entrypoint.sh` → `prestart.sh`): `python -m app.cli.pre_start` (wait for the DB), `app.cli.storage_init` (bucket + policy), `alembic upgrade head`, `app.cli.initial_data` (first superuser), then the command.
- Command: `fastapi run app/main.py`; the number of workers comes from `WEB_CONCURRENCY` (default 2).
- Dev override (from compose.override.yml): `fastapi run --reload app/main.py` with `develop.watch` sync.

### `frontend/Dockerfile`

Multi-stage build producing a small Caddy image with both Vite apps:

```
Stage 0: deps            — oven/bun:1.4, bun install --frozen-lockfile (workspace manifests only, for caching)
Stage 1: workspace-build — builds creator-workspace (+ packages/shared) with VITE_API_URL + VITE_GOOGLE_CLIENT_ID
Stage 2: site-build      — builds creator-site (+ packages/shared) with VITE_API_URL
Stage 3: caddy:2.11-alpine — copies both dists, installs frontend/Caddyfile
```

Build args passed from compose.override.yml:

| Arg | Value |
|---|---|
| `VITE_API_URL` | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | from `.env` |

These are **baked into the JavaScript bundle** at build time. Changing them requires a full image rebuild.

### `frontend/Dockerfile.playwright`

- Playwright 1.57 image with the same pinned Bun copied in (no `curl | bash`)
- Not built by `docker compose up`: it sits behind the `test` profile and only builds when you `run` it
- Runs Playwright E2E tests
- Used by the `playwright` service in compose.override.yml

## Environment Variables

The `.env` file is loaded by Docker Compose and injected into each service. See [docs/README.md](README.md#key-environment-variables) for the full list.

After changing `.env`:
- **Runtime variables** (backend config, DB passwords): `docker compose ... up -d` to recreate containers
- **Build-time variables** (`VITE_*`): rebuild the frontend image (`docker compose build frontend`)
