# CreatorHandle — Docker Setup

All Compose files live in `deploy/`. Commands must be run from the **repo root** with explicit file flags.

## Compose Files

| File | Used For |
|---|---|
| `deploy/compose.yml` | Base stack definition (all environments) |
| `deploy/compose.override.yml` | Local dev overrides — adds live-reload, Traefik dev proxy, Mailcatcher, port mappings |
| `deploy/compose.traefik.yml` | Production public Traefik proxy (run once per server, outside the app stack) |

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

# Production deploy (only compose.yml, no dev overrides)
docker compose -f deploy/compose.yml up -d
```

## Services

| Service | Image | Port (local) | Description |
|---|---|---|---|
| `db` | postgres:18 | 5432 | PostgreSQL database |
| `backend` | `docker/Dockerfile.backend` | 8000 | FastAPI application |
| `frontend` | `docker/Dockerfile.frontend` | 5173→80 | Nginx serving both Vite apps |
| `adminer` | adminer | 8080 | Database web UI |
| `prestart` | backend image | — | Runs Alembic migrations + seeds superuser |
| `proxy` | traefik:3.6 | 80, 8090 | Dev: insecure proxy; Prod: TLS termination |
| `mailcatcher` | schickling/mailcatcher | 1025 (SMTP), 1080 (Web) | Catches all outbound email in dev |
| `playwright` | `docker/Dockerfile.playwright` | 9323 | E2E test runner |

## Local Dev URLs

| Service | URL |
|---|---|
| Dashboard | http://localhost:5173 |
| Public creator profile | http://localhost:5173/creator/{username} |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Adminer | http://localhost:8080 |
| Mailcatcher | http://localhost:1080 |
| Traefik UI | http://localhost:8090 |

## Dockerfile Details

### `docker/Dockerfile.backend`

- Base: `python:3.10`
- Package manager: `uv` (installed from ghcr.io/astral-sh/uv)
- Build: installs dependencies, copies `backend/app/`
- Production command: `fastapi run --workers 4 app/main.py`
- Dev override (from compose.override.yml): `fastapi run --reload app/main.py` with volume mount

### `docker/Dockerfile.frontend`

Multi-stage build producing a single Nginx image with both Vite apps:

```
Stage 0: deps          — bun install (Bun workspace, shared lockfile)
Stage 1: workspace-build — builds creator-workspace with VITE_API_URL + VITE_GOOGLE_CLIENT_ID
Stage 2: site-build    — builds creator-site with VITE_API_URL
Stage 3: nginx:1       — copies both dists, applies nginx.conf
```

Build args passed from compose.override.yml:

| Arg | Value |
|---|---|
| `VITE_API_URL` | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | from `deploy/.env` |

These are **baked into the JavaScript bundle** at build time. Changing them requires a full image rebuild.

### `docker/Dockerfile.playwright`

- Extends the frontend build (shares `bun install`)
- Runs Playwright E2E tests
- Used by the `playwright` service in compose.override.yml

## Environment Variables

The `deploy/.env` file is loaded by Docker Compose and injected into each service. See [docs/README.md](../docs/README.md#key-environment-variables) for the full list.

After changing `.env`:
- **Runtime variables** (backend config, DB passwords): `docker compose ... up -d` to recreate containers
- **Build-time variables** (`VITE_*`): must rebuild the frontend image with `--no-cache`
