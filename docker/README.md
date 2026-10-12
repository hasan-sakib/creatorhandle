# CreatorHandle — Docker Setup

All Compose files live in `deploy/`. Commands must be run from the **repo root** with explicit file flags.

## Compose Files

| File | Used For |
|---|---|
| `deploy/compose.yml` | Base stack definition (all environments) |
| `deploy/compose.override.yml` | Local dev overrides — adds live-reload, Mailcatcher, port mappings, dev dependencies |
| `deploy/compose.prod.yml` | Production additions: publishes ports 80/443 and sets the public domain (`docker compose -f deploy/compose.yml -f deploy/compose.prod.yml up -d --build`) |

## Common Commands

```bash
# Start full local stack (applies both compose.yml + compose.override.yml)
docker compose -f deploy/compose.yml -f deploy/compose.override.yml up -d

# Start with backend hot-reload (watches backend/ for changes)
docker compose -f deploy/compose.yml -f deploy/compose.override.yml watch

# View all logs
docker compose -f deploy/compose.yml -f deploy/compose.override.yml logs -f

# View logs for one service
docker compose -f deploy/compose.yml -f deploy/compose.override.yml logs backend -f

# Stop everything
docker compose -f deploy/compose.yml -f deploy/compose.override.yml down

# Stop and wipe database volumes (resets all data)
docker compose -f deploy/compose.yml -f deploy/compose.override.yml down -v

# Rebuild a specific image (e.g. after changing VITE_GOOGLE_CLIENT_ID)
docker compose -f deploy/compose.yml -f deploy/compose.override.yml build --no-cache frontend

# Production deploy (no dev overrides)
docker compose -f deploy/compose.yml -f deploy/compose.prod.yml up -d --build
```

## Services

| Service | Image | Port (local) | Description |
|---|---|---|---|
| `db` | postgres:18 | 5432 | PostgreSQL database |
| `backend` | `docker/Dockerfile.backend` | 8000 | FastAPI application (runs migrations + seeds superuser on start) |
| `frontend` | `docker/Dockerfile.frontend` | 5173→80 | Caddy: serves both Vite apps, proxies `/api` to the backend, HTTPS in prod |
| `mailcatcher` | schickling/mailcatcher | 1025 (SMTP), 1080 (Web) | Catches all outbound email in dev |
| `playwright` | `docker/Dockerfile.playwright` | 9323 | E2E test runner (on demand: `docker compose ... run --rm playwright`) |

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

### `docker/Dockerfile.backend`

- Multi-stage: a builder stage (`python:3.10-slim` + `uv`) installs dependencies into a virtualenv, and the runtime stage (`python:3.10-slim`) copies only that virtualenv and the app. No `uv`, build cache or dev tools in the final image (~390 MB).
- `INSTALL_DEV` build arg (default `false`): `true` also installs the dev dependencies (pytest, ruff, mypy, ...) and ships `backend/tests`. `compose.override.yml` and `deploy/scripts/test*.sh` set it.
- Entrypoint (`backend/scripts/entrypoint.sh`): waits for the DB, runs `alembic upgrade head`, seeds the first superuser, then starts the command.
- Command: `fastapi run app/main.py`; the number of workers comes from `WEB_CONCURRENCY` (default 2).
- Dev override (from compose.override.yml): `fastapi run --reload app/main.py` with `develop.watch` sync.

### `docker/Dockerfile.frontend`

Multi-stage build producing a small Caddy image with both Vite apps:

```
Stage 0: deps          — bun install (Bun workspace, shared lockfile)
Stage 1: workspace-build — builds creator-workspace with VITE_API_URL + VITE_GOOGLE_CLIENT_ID
Stage 2: site-build    — builds creator-site with VITE_API_URL
Stage 3: caddy:2-alpine — copies both dists, installs frontend/Caddyfile
```

Build args passed from compose.override.yml:

| Arg | Value |
|---|---|
| `VITE_API_URL` | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | from `deploy/.env` |

These are **baked into the JavaScript bundle** at build time. Changing them requires a full image rebuild.

### `docker/Dockerfile.playwright`

- Extends the frontend build (shares `bun install`)
- Not built by `docker compose up`: it sits behind the `test` profile and only builds when you `run` it
- Runs Playwright E2E tests
- Used by the `playwright` service in compose.override.yml

## Environment Variables

The `deploy/.env` file is loaded by Docker Compose and injected into each service. See [docs/README.md](../docs/README.md#key-environment-variables) for the full list.

After changing `.env`:
- **Runtime variables** (backend config, DB passwords): `docker compose ... up -d` to recreate containers
- **Build-time variables** (`VITE_*`): must rebuild the frontend image with `--no-cache`
