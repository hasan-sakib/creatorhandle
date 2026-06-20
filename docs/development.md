# CreatorHandle — Local Development Guide

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Bun](https://bun.sh/) — `curl -fsSL https://bun.sh/install | bash`
- [uv](https://docs.astral.sh/uv/) — `curl -LsSf https://astral.sh/uv/install.sh | sh`

## First-Time Setup

```bash
# 1. Clone the repo
git clone <repo-url> && cd creatorhandle

# 2. Fill in required env vars in deploy/.env
#    At minimum: SECRET_KEY, POSTGRES_PASSWORD, FIRST_SUPERUSER, FIRST_SUPERUSER_PASSWORD
#    For Google login: GOOGLE_CLIENT_ID + VITE_GOOGLE_CLIENT_ID

# 3. Start everything
docker compose -f deploy/compose.yml -f deploy/compose.override.yml up -d
```

The prestart service automatically runs `alembic upgrade head` and seeds the first superuser before the backend starts.

## Service URLs

| Service | URL |
|---|---|
| Dashboard | http://localhost:5173 |
| Public creator profile | http://localhost:5173/creator/{username} |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Adminer | http://localhost:8080 |
| Traefik UI | http://localhost:8090 |
| Mailcatcher | http://localhost:1080 |

## Running With Live Reload

### Backend hot-reload (recommended for backend work)

```bash
# Backend syncs code changes automatically via compose watch
docker compose -f deploy/compose.yml -f deploy/compose.override.yml watch
```

The override file mounts `backend/` as a volume and runs `fastapi run --reload`, so Python changes are reflected immediately.

### Frontend local dev server

The Docker frontend is a static nginx build — it does NOT hot-reload. For frontend development, stop the Docker frontend and run the Vite dev server locally:

```bash
# Stop the Docker frontend
docker compose -f deploy/compose.yml -f deploy/compose.override.yml stop frontend

# Run creator-workspace dev server
cd frontend/creator-workspace
bun install
bun run dev   # http://localhost:5173

# OR run creator-site dev server
cd frontend/creator-site
bun install
bun run dev   # starts on a different port (check vite.config.ts)
```

To rebuild and restart the frontend Docker container after making changes:

```bash
docker compose -f deploy/compose.yml -f deploy/compose.override.yml build --no-cache frontend
docker compose -f deploy/compose.yml -f deploy/compose.override.yml up -d frontend
```

## Backend Development

### Install dependencies locally

```bash
cd backend
uv sync
source .venv/bin/activate
```

### Database migrations

Always run migrations inside the backend Docker container so the container's database connection is used:

```bash
# Shell into the backend container
docker compose -f deploy/compose.yml -f deploy/compose.override.yml exec backend bash

# Auto-generate a migration after changing models.py
alembic revision --autogenerate -m "describe the change"

# Apply migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

### Running backend tests

```bash
# Via Docker
docker compose -f deploy/compose.yml -f deploy/compose.override.yml exec backend bash scripts/tests-start.sh

# Stop on first failure
docker compose -f deploy/compose.yml -f deploy/compose.override.yml exec backend bash scripts/tests-start.sh -x
```

Test coverage report is written to `backend/htmlcov/index.html`.

### Regenerating the frontend API client

After changing backend endpoints, regenerate the TypeScript client:

```bash
# Requires backend to be running
bash ./scripts/generate-client.sh
```

Or manually:

```bash
# Download the OpenAPI schema
curl http://localhost:8000/api/v1/openapi.json > frontend/creator-workspace/openapi.json

# Generate the client
cd frontend/creator-workspace
bun run generate-client
```

Commit the generated files in `frontend/creator-workspace/src/client/`.

## Frontend Development

### Workspace structure

The frontend is a **Bun workspace** with two apps:

```
frontend/
├── creator-workspace/   # authenticated dashboard (served at /)
└── creator-site/        # public profiles (served at /creator/)
```

Install all workspace dependencies from the repo root:

```bash
bun install
```

### Adding routes (creator-workspace)

Routes live in `frontend/creator-workspace/src/routes/`. After adding or renaming a file, update `routeTree.gen.ts` to include the new route. TanStack Router's file-based routing is used, but auto-generation is not configured — maintain `routeTree.gen.ts` manually or run the Vite plugin to generate it.

### Cross-app navigation

creator-site runs at basepath `/creator`. Links that navigate to the dashboard (creator-workspace) must use plain HTML `<a href="...">` tags — not TanStack `<Link>` — to trigger a full page navigation across apps:

```tsx
// Correct — full page navigation to dashboard
<a href="/login">Log in</a>

// Wrong — stays within creator-site's router
<Link to="/login">Log in</Link>
```

### Running E2E tests

```bash
# Requires backend + frontend Docker containers to be running
cd frontend/creator-workspace
bunx playwright test

# Interactive UI mode
bunx playwright test --ui
```

## Mailcatcher

All emails sent by the backend (password recovery, etc.) are captured by Mailcatcher during local development. View them at http://localhost:1080.

The backend is pre-configured to use Mailcatcher when `compose.override.yml` is active (`SMTP_HOST=mailcatcher`, `SMTP_PORT=1025`).

## Environment Variables

The `.env` file at `deploy/.env` is the single source of truth for local config. After changing it, restart affected services:

```bash
docker compose -f deploy/compose.yml -f deploy/compose.override.yml up -d
```

For `VITE_*` variables (baked into the frontend bundle at build time), a full rebuild is required:

```bash
docker compose -f deploy/compose.yml -f deploy/compose.override.yml build --no-cache frontend
docker compose -f deploy/compose.yml -f deploy/compose.override.yml up -d frontend
```

## Pre-commit Hooks

The project uses [prek](https://prek.j178.dev/) for pre-commit linting (Ruff for Python, Biome for TypeScript/JSON).

```bash
# Install hooks
cd backend
uv run prek install -f

# Run manually on all files
uv run prek run --all-files
```

## Logs

```bash
# All services
docker compose -f deploy/compose.yml -f deploy/compose.override.yml logs -f

# Single service
docker compose -f deploy/compose.yml -f deploy/compose.override.yml logs backend -f
docker compose -f deploy/compose.yml -f deploy/compose.override.yml logs frontend -f
```
