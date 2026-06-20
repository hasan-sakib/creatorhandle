# CreatorHandle — Project Overview

## What It Is

CreatorHandle is a creator management platform. Each creator gets:
- A **public profile page** at `/creator/{username}` — visible to anyone, no login required
- A **private workspace dashboard** at `/` — manage brands, projects, tasks, and settings

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI 0.115, Python 3.10 |
| ORM / Schema | SQLModel + Pydantic v2 |
| Database | PostgreSQL 18 |
| Migrations | Alembic |
| Authentication | JWT (HS256) + Google OAuth 2.0 |
| Dashboard frontend | React 19, TanStack Router v1, TanStack Query v5 |
| Public frontend | React 19, TanStack Router v1 (basepath `/creator`) |
| Styling | Tailwind CSS v4, shadcn/ui components |
| Package manager | Bun (frontend), uv (backend) |
| Reverse proxy | Traefik v3 (production), included in dev override |
| Frontend serving | Nginx (single container, path-based routing) |
| Container runtime | Docker Compose |
| E2E tests | Playwright |
| Backend tests | Pytest |
| Linting | Biome (frontend), Ruff (backend) |

## System Architecture

```
Browser
   │
   ├─ /creator/*  ──► Nginx ──► creator-site dist   (public profiles)
   │
   └─ /*          ──► Nginx ──► creator-workspace dist (dashboard)
                                     │
                                     │  API calls (VITE_API_URL)
                                     ▼
                              FastAPI  :8000
                                     │
                                     ▼
                              PostgreSQL :5432
```

### Frontend — Two Separate Vite Apps

The `frontend/` directory contains a **Bun workspace** with two independent Vite applications:

| App | Directory | Path | Purpose |
|---|---|---|---|
| creator-workspace | `frontend/creator-workspace/` | `/` | Authenticated dashboard |
| creator-site | `frontend/creator-site/` | `/creator/` | Public creator profiles |

Both apps are built at deploy time and served from a **single Nginx container**. Nginx routes requests based on the URL prefix:

```nginx
location /creator/ → /usr/share/nginx/creator-site/
location /         → /usr/share/nginx/creator-workspace/
```

creator-site uses TanStack Router with `basepath: "/creator"` so the route `/$username` matches `/creator/sakib`.

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
| backend | custom (uv + Python 3.10) | 8000 | FastAPI with 4 workers in prod |
| frontend | custom (bun + nginx) | 5173→80 | Serves both Vite apps |
| adminer | adminer | 8080 | DB admin UI |
| prestart | backend image | — | Runs Alembic migrations on startup |
| proxy | traefik:3.6 | 80, 8090 | Dev: insecure mode; Prod: TLS |
| mailcatcher | schickling/mailcatcher | 1025/1080 | Dev SMTP trap |
| playwright | custom | 9323 | E2E test runner |

### Docker Build — Frontend Multi-Stage

```
Stage 0 (deps)        — bun install (shared workspace)
Stage 1 (workspace-build) — builds creator-workspace
Stage 2 (site-build)  — builds creator-site
Stage 3 (nginx:1)     — copies both dists, serves with nginx
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
│   │       └── routes/      # /$username route
│   └── nginx.conf
├── deploy/
│   ├── .env                 # environment variables
│   ├── compose.yml          # production stack
│   ├── compose.override.yml # local dev overrides
│   └── compose.traefik.yml  # production Traefik
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
| `DOMAIN` | Base domain for Traefik routing |
| `SMTP_HOST` | SMTP server for email (Mailcatcher in dev) |
| `SENTRY_DSN` | Optional Sentry error tracking |
