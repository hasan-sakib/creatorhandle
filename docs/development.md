# CreatorHandle — Local Development Guide

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose v2
- [uv](https://docs.astral.sh/uv/) (Python 3.12 is installed by uv as needed)
- [Bun](https://bun.sh/) 1.4
- Node 23.6+ only if you run the contrast checker (`bun run test:contrast` in `frontend/`)

## First-time setup

```bash
git clone <repo-url> && cd creatorhandle
make setup     # creates .env from .env.example, installs uv + bun deps, git hooks
# edit .env: at least SECRET_KEY, POSTGRES_PASSWORD, FIRST_SUPERUSER(_PASSWORD), S3_SECRET_KEY
make up        # builds and starts the stack, waits until it is healthy
```

`make help` lists every command. Everything reads the single `.env` at the repo
root (Compose, the backend when run on the host, Vite, Playwright).

The backend container waits for the database, creates the storage bucket,
runs `alembic upgrade head` and seeds the first superuser on every start.

## Service URLs

| Service | URL |
|---|---|
| Marketing site | http://localhost:5173 |
| Dashboard | http://localhost:5173/app/ |
| Public creator profile | http://localhost:5173/@{username} |
| Backend API / Swagger | http://localhost:8000, http://localhost:8000/docs |
| Liveness / readiness | `/api/v1/utils/health-check/`, `/api/v1/utils/ready/` |
| PostgreSQL | localhost:5432 |
| Mailcatcher (all dev email) | http://localhost:1080 |
| RustFS console (uploads) | http://localhost:9001 (login: `S3_ACCESS_KEY` / `S3_SECRET_KEY`) |

## Day-to-day

| Task | Command |
|---|---|
| Start / stop the stack | `make up` / `make down` (volumes are kept) |
| Backend live-sync | `make dev` (`docker compose watch`; the API reloads on save) |
| Logs | `make logs` or `make logs s=backend` |
| Lint, format, type-check | `make lint`, `make format`, `make typecheck` (`make check` = lint + types) |
| Backend tests | `make test` |
| E2E tests | `make test-e2e` (stack must be up) |
| Regenerate API clients | `make client` |
| New migration | `make migration m="add foo"` then `make migrate` |
| psql | `make shell-db` |

Pre-commit hooks ([prek](https://prek.j178.dev/)) run ruff, Biome and the API
client generator; `make setup` installs them. Run all of them with
`uv run prek run --all-files`.

## Backend

Code layout (see [backend/README.md](../backend/README.md) for details):
`app/api` (HTTP routes), `app/core` (config, db, security, logging, storage),
`app/domain` (permissions, validation, image rules), `app/models` and
`app/crud` (one module per domain), `app/emails`, `app/cli` (start-up commands).

### Running the API on the host

```bash
docker compose stop backend   # free port 8000; db and rustfs keep running
make dev-backend              # fastapi dev with reload, reads ../.env
```

Uploads are disabled on the host unless you also set `S3_ENDPOINT_URL`
(RustFS's S3 port is not published in dev).

### Migrations

Change a model in `app/models/`, then generate the migration on the host so
the file lands in your working tree:

```bash
make migration m="describe the change"   # alembic revision --autogenerate
make migrate                             # apply it in the dev container
```

CI runs `alembic check`, which fails if models and migrations disagree.

### Tests

`make test` runs pytest inside the backend container against a **separate
database** (`<POSTGRES_DB>_test`, created and migrated automatically). The
test session deletes every user it can see when it finishes, so
`tests/conftest.py` refuses to run against any database whose name does not
end in `_test`. Coverage HTML is written to `backend/htmlcov/`.

Upload tests talk to RustFS and are skipped when storage is not configured.

### API clients

After changing endpoints or schemas, run `make client` and commit both
generated clients: `frontend/creator-workspace/src/client` (whole API) and
`frontend/creator-site/src/client` (public endpoints only, filtered by
`frontend/scripts/openapi_public.py`). CI fails if they are stale.

## Frontend

A Bun workspace with two apps and a small shared package:

```
frontend/
├── creator-workspace/   dashboard, served at /app
├── creator-site/        marketing page + public profiles, served at / and /@username
└── packages/shared/     @creatorhandle/shared: accent presets, theme keys, cn()
```

The Docker `frontend` service is a static Caddy build without hot reload. For
UI work, stop it and run a Vite dev server (both default to port 5173, so run
one at a time or pass `--port`):

```bash
docker compose stop frontend
make dev-workspace     # http://localhost:5173/app/
make dev-site          # http://localhost:5173/
```

`VITE_API_URL` in `.env` points the dev servers at the backend
(`http://localhost:8000`). `VITE_*` values are baked in at build time; after
changing one, rebuild the image: `docker compose build frontend && docker compose up -d frontend`.

- Routes are file-based (TanStack Router); `routeTree.gen.ts` is regenerated
  by the Vite plugin on `dev`/`build`.
- Links between the two apps must be plain `<a href>` (full navigation), e.g.
  `<a href={dashboardPath("/login")}>` in creator-site, not the router's `<Link>`.
- Biome (one config in `frontend/biome.json`) formats and lints both apps.

### E2E tests

Playwright tests live in `frontend/creator-workspace/tests` and run against
the stack on http://localhost:5173 (`make up` first). They create users
through the dev API.

```bash
make test-e2e
cd frontend/creator-workspace && bun run test:e2e:ui   # interactive
```

## Image uploads

`POST /api/v1/uploads/images` accepts JPEG, PNG, WebP or GIF up to
`MEDIA_MAX_UPLOAD_MB`. The backend strips metadata, resizes (avatar 512 px,
cover 2400 px, thumbnail 1600 px) and stores WebP in RustFS, returning a path
like `/media/images/<owner>/<id>.webp`. Caddy serves `/media/*` read-only from
storage, so the same path works in dev and production. Users can only attach
images they uploaded (the `<owner>` part is an HMAC of their id).

## Logs

Locally logs are plain text; with `ENVIRONMENT` other than `local` they are
JSON lines. Every request is logged once (method, path, status, duration)
with a request id that is also returned in the `X-Request-ID` header. Health
and readiness polls are logged at DEBUG only. Set `LOG_LEVEL` in `.env`.
