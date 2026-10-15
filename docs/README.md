# CreatorHandle — Project Overview

## What It Is

CreatorHandle is a creator management platform. Each creator gets:
- A **public profile page** at `<domain>/@{username}` (e.g. `creatorhandle.com/@sakib`) — visible to anyone, no login required, and only once the creator explicitly publishes it from User Settings
- A **private workspace dashboard** at `<domain>/app` — manage brands, projects, tasks, and settings

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI 0.115, Python 3.10 |
| ORM / Schema | SQLModel + Pydantic v2 |
| Database | PostgreSQL 18 |
| Migrations | Alembic |
| Authentication | JWT (HS256) + Google OAuth 2.0 |
| Dashboard frontend | React 19, TanStack Router v1, TanStack Query v5 |
| Public frontend | React 19, TanStack Router v1 |
| Styling | Tailwind CSS v4, shadcn/ui components |
| Package manager | Bun (frontend), uv (backend) |
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
| brands | `/api/v1/brands` | JWT | Brand management |
| projects | `/api/v1/projects` | JWT | Project management |
| tasks | `/api/v1/tasks` | JWT | Task management |
| items | `/api/v1/items` | JWT | Item management |
| public | `/api/v1/public` | None | Public creator profile reads |
| utils | `/api/v1/utils` | Superuser | Health check, test email |
| private | `/api/v1/private` | None | Test helpers (local env only) |

### Authentication

Two flows are supported:

1. **Email + password** — `POST /api/v1/login/access-token` returns a JWT.
2. **Google OAuth (implicit flow)** — frontend calls `useGoogleLogin()` from `@react-oauth/google`, receives a Google `access_token`, sends it to `POST /api/v1/login/google`. Backend verifies the token via Google's `/oauth2/v3/userinfo` endpoint and returns an app JWT. Google-only accounts have `hashed_password = NULL`.

### Data Model

```
User
 ├── Items (owned by user)
 ├── Brands (owned by user)
 │    └── Projects (belong to brand, owned by user)
 │         └── Tasks (belong to project, owned by user)
 └── Tasks (also directly owned by user)
```

All entities use UUID primary keys. Cascade deletes are configured throughout the tree.

### Docker Compose Services

| Service | Image | Port | Notes |
|---|---|---|---|
| db | postgres:18 | 5432 | Primary datastore |
| rustfs | rustfs/rustfs | 9001 (dev console) | Object storage for uploaded images; private to the Docker network, public reads go through Caddy at `/media/*` |
| backend | custom (uv + Python 3.10-slim) | 8000 (dev) | FastAPI, `WEB_CONCURRENCY` workers (default 2); runs Alembic migrations on startup |
| frontend | custom (bun build + caddy:2-alpine) | 5173→80 (dev), 80/443 (prod) | Serves both Vite apps, proxies `/api`, HTTPS in prod |
| mailcatcher | schickling/mailcatcher | 1025/1080 | Dev SMTP trap |
| playwright | custom | 9323 | E2E test runner |

### Docker Build — Frontend Multi-Stage

```
Stage 0 (deps)        — bun install (shared workspace)
Stage 1 (workspace-build) — builds creator-workspace
Stage 2 (site-build)  — builds creator-site
Stage 3 (caddy:2-alpine) — copies both dists and the Caddyfile
```

Build args: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`

## Directory Structure

```
creatorhandle/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # FastAPI routers
│   │   ├── core/            # config, db, security
│   │   ├── alembic/         # migrations
│   │   ├── models.py        # SQLModel table + schema models
│   │   ├── crud.py          # database operations
│   │   └── main.py          # app factory
│   ├── tests/               # Pytest tests
│   └── pyproject.toml
├── frontend/
│   ├── creator-workspace/   # dashboard Vite app
│   │   └── src/
│   │       ├── client/      # auto-generated OpenAPI client
│   │       ├── components/  # UI components
│   │       ├── hooks/       # useAuth, useCustomToast
│   │       └── routes/      # TanStack Router file-based routes
│   ├── creator-site/        # public profile Vite app
│   │   └── src/
│   │       ├── components/
│   │       └── routes/      # /@{username} route
│   └── Caddyfile
├── deploy/
│   ├── .env                 # environment variables
│   ├── compose.yml          # base stack: db, backend, frontend
│   ├── compose.prod.yml     # production: ports 80/443 + domain
│   └── compose.override.yml # local dev overrides (ports, mailcatcher, playwright)
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── Dockerfile.playwright
└── docs/
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
