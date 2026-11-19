# CreatorHandle — Project Overview

## What It Is

CreatorHandle is a creator management platform. Each creator gets:
- A **public profile page** at `<domain>/@{username}` (e.g. `creatorhandle.com/@sakib`) — visible to anyone, no login required, and only once the creator explicitly publishes it from User Settings
- A **private workspace dashboard** at `<domain>/app` — manage brands, projects, tasks, and settings

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI 0.115, Python 3.12 |
| ORM / Schema | SQLModel + Pydantic v2 |
| Database | PostgreSQL 18 |
| Migrations | Alembic |
| Authentication | JWT (HS256) + Google OAuth 2.0 |
| Dashboard frontend | React 19, TanStack Router v1, TanStack Query v5 |
| Public frontend | React 19, TanStack Router v1 |
| Styling | Tailwind CSS v4, shadcn/ui components |
| Package manager | Bun workspaces (frontend), uv (backend) |
| Quality | ruff, mypy (strict), Biome, tsc, pytest, Playwright, GitHub Actions CI |
| Web server / reverse proxy | Caddy 2 (one container: auto-HTTPS, serves both SPAs, proxies `/api` and `/media`) |
| Object storage | RustFS (S3-compatible) for uploaded images |
| Container runtime | Docker Compose |
| E2E tests | Playwright |
| Backend tests | Pytest |
| Linting | Biome (frontend), Ruff (backend) |

## System Architecture

```
Browser  ──►  https://<domain>  (one origin)
                 │
              Caddy (frontend container)
                 │
                 ├─ /api/*, /docs ──► FastAPI :8000 ──► PostgreSQL :5432
                 │
                 └─ everything else ──► Caddy (static files)
                                          ├─ /app/*        creator-workspace dist (dashboard)
                                          └─ /, /@username creator-site dist (marketing + profiles)
```

### Frontend — Two Separate Vite Apps

The `frontend/` directory contains a **Bun workspace** with two independent Vite applications:

| App | Directory | Path | Purpose |
|---|---|---|---|
| creator-workspace | `frontend/creator-workspace/` | `/app` | Authenticated dashboard |
| creator-site | `frontend/creator-site/` | `/` and `/@{username}` | Marketing homepage and public creator profiles |

Both apps are built at deploy time and served from a **single Caddy container** using path-based routing (`frontend/Caddyfile`). creator-workspace is built with Vite `base: "/app/"` and a TanStack Router `basepath` of `/app`; creator-site owns the root, and its `routes/@{$username}.tsx` renders a profile.

Because everything is one origin, links between the two apps are plain same-origin paths (see `creator-site/src/lib/urls.ts`), the dashboard's JWT in `localStorage` is on the same origin as the profiles, and in production the API needs no CORS (the browser calls `/api` on the same host). Local dev serves the apps on `http://localhost:5173` and the API on `http://localhost:8000`, which is allowed through `BACKEND_CORS_ORIGINS`.

A profile is only publicly visible once its owner has explicitly published it from User Settings (`User.is_published`). Usernames are limited to letters, digits, `_` and `-` so they are safe in a URL path.

### Backend — FastAPI

All API routes are mounted under `/api/v1/`. The OpenAPI schema is available at `/api/v1/openapi.json`.

| Router | Prefix | Auth | Description |
|---|---|---|---|
| login | `/api/v1/` | None | Token login, Google OAuth, password recovery |
| users | `/api/v1/users` | JWT | User CRUD (self + superuser admin) |
| workspaces | `/api/v1/workspaces` | JWT | Workspaces and members (role-based permissions) |
| brands | `/api/v1/brands` | JWT | Brand management |
| projects | `/api/v1/projects` | JWT | Project management |
| tasks | `/api/v1/tasks` | JWT | Task management |
| collaborators | `/api/v1/collaborators` | JWT | Named collaborators tasks can be assigned to |
| uploads | `/api/v1/uploads` | JWT | Image uploads to RustFS |
| items | `/api/v1/items` | JWT | Item management |
| public | `/api/v1/public` | None | Public creator profile reads |
| utils | `/api/v1/utils` | None / Superuser | `health-check/` (liveness), `ready/` (DB + storage), test email (superuser) |
| private | `/api/v1/private` | None | Test helpers (local env only) |

### Authentication

Two flows are supported:

1. **Email + password** — `POST /api/v1/login/access-token` returns a JWT.
2. **Google OAuth (implicit flow)** — frontend calls `useGoogleLogin()` from `@react-oauth/google`, receives a Google `access_token`, sends it to `POST /api/v1/login/google`. When `GOOGLE_CLIENT_ID` is set the backend first checks, via Google's `tokeninfo` endpoint, that the token was issued to this app, then reads the profile from `/oauth2/v3/userinfo` and returns an app JWT. Google-only accounts have `hashed_password = NULL`.

### Data Model

```
User ── WorkspaceMember (role: owner/admin/manager/member/viewer) ── Workspace
                                                                     ├── Brands
                                                                     │    └── Projects
                                                                     │         └── Tasks
                                                                     ├── Collaborators ── Tasks (assignee)
                                                                     └── Projects without a brand
User ── Items (template feature, owned per user)
```

Every user gets a personal workspace on sign-up. Brands, projects, tasks and
collaborators belong to a workspace (requests carry `X-Workspace-Id`) and may
only reference records in the same workspace. All entities use UUID primary
keys; deleting a brand deletes its projects and their tasks, and deleting a
collaborator unassigns their tasks.

### Docker Compose Services

| Service | Image | Port | Notes |
|---|---|---|---|
| db | postgres:18 | 5432 | Primary datastore |
| rustfs | rustfs/rustfs | 9001 (dev console) | Object storage for uploaded images; private to the Docker network, public reads go through Caddy at `/media/*` |
| backend | custom (uv + python:3.12-slim, non-root) | 8000 (dev) | FastAPI, `WEB_CONCURRENCY` workers (default 2); runs Alembic migrations on startup; healthcheck on `/api/v1/utils/ready/` |
| frontend | custom (bun build + caddy:2.11-alpine) | 5173→80 (dev), 80/443 (prod) | Serves both Vite apps, proxies `/api`, HTTPS in prod |
| mailcatcher | schickling/mailcatcher | 1025/1080 | Dev SMTP trap |
| playwright | custom | 9323 | E2E test runner |

### Docker Build — Frontend Multi-Stage

```
Stage 0 (deps)        — bun install (shared workspace)
Stage 1 (workspace-build) — builds creator-workspace
Stage 2 (site-build)  — builds creator-site
Stage 3 (caddy:2.11-alpine) — copies both dists and the Caddyfile
```

Build args: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`

## Directory Structure

```
creatorhandle/
├── backend/                 FastAPI service (uv workspace member)
│   ├── Dockerfile           multi-stage, non-root runtime
│   ├── app/
│   │   ├── main.py          app wiring: CORS, Sentry, logging, routers
│   │   ├── api/             HTTP layer: deps.py, routes/<domain>.py
│   │   ├── core/            config, db, security, log, storage, media paths
│   │   ├── domain/          permissions, validators, image processing
│   │   ├── models/          SQLModel tables + schemas, one module per domain
│   │   ├── crud/            persistence helpers (users, workspaces, items)
│   │   ├── emails/          email sending + MJML templates (src/ and built build/)
│   │   ├── cli/             start-up commands (python -m app.cli.<name>)
│   │   └── alembic/         migrations
│   ├── scripts/             container scripts: entrypoint, prestart, tests-start
│   └── tests/               pytest (api/, crud/, cli/, utils/)
├── frontend/                Bun workspace
│   ├── Dockerfile           builds both apps into one Caddy image
│   ├── Dockerfile.playwright
│   ├── Caddyfile            single-origin routing (/api, /media, /app, site)
│   ├── biome.json           lint/format config for all frontend code
│   ├── creator-workspace/   dashboard SPA (src/{client,components,hooks,lib,providers,routes}, tests/)
│   ├── creator-site/        public site SPA (src/{client,components,hooks,lib,routes,styles}, scripts/)
│   └── packages/shared/     @creatorhandle/shared: accents, theme keys, cn()
├── scripts/                 generate-client.sh, openapi_public.py, test.sh, test-local.sh
├── docs/                    this folder
├── .github/workflows/ci.yml lint → type-check → test → build
├── compose.yml              base stack: db, rustfs, backend, frontend
├── compose.override.yml     dev (auto-applied): ports, reload, mailcatcher, playwright
├── compose.prod.yml         production: ports 80/443 + domain
├── .env.example             every setting, documented (copy to .env)
├── Makefile                 common commands (`make help`)
├── package.json, bun.lock   JS workspace
└── pyproject.toml, uv.lock  Python workspace
```

## Key Environment Variables

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing key (generate with `secrets.token_urlsafe(32)`) |
| `POSTGRES_PASSWORD` | Database password |
| `FIRST_SUPERUSER` | Admin email created on first start |
| `FIRST_SUPERUSER_PASSWORD` | Admin password |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID (backend) |
| `VITE_GOOGLE_CLIENT_ID` | Same value, baked into frontend bundle at build time |
| `VITE_API_URL` | Backend URL used by frontend (e.g. `http://localhost:8000`) |
| `ENVIRONMENT` | `local` / `staging` / `production` |
| `DOMAIN` | Public domain Caddy serves (one host serves the site, `/app`, `/api` and `/media`) |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Credentials for the image storage (RustFS). Required; use a long random secret in production |
| `MEDIA_MAX_UPLOAD_MB` | Largest accepted image upload (default 5) |
| `SMTP_HOST` | SMTP server for email (Mailcatcher in dev) |
| `SENTRY_DSN` | Optional Sentry error tracking |
| `LOG_LEVEL` | `DEBUG`/`INFO`/`WARNING`/`ERROR`; logs are JSON lines outside `ENVIRONMENT=local` |
| `WEB_CONCURRENCY` | Uvicorn worker processes (default 2) |

The full, commented list is in [`.env.example`](../.env.example).
