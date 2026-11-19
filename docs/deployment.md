# CreatorHandle — Deployment Guide

## Overview

Production is four containers managed by Docker Compose:

| Service | What it is |
|---|---|
| `frontend` | [Caddy](https://caddyserver.com/): serves both SPAs, proxies `/api`, `/docs` and `/redoc` to the backend, and obtains/renews the TLS certificate for `DOMAIN` automatically (Let's Encrypt) |
| `backend` | FastAPI. Waits for the DB, runs `alembic upgrade head` and seeds the first superuser on every start, then serves |
| `db` | PostgreSQL |
| `rustfs` | S3-compatible storage for uploaded images (private network only; Caddy serves public reads at `/media/*`) |

There is no separate reverse-proxy stack: Caddy owns ports 80 and 443 on the server, so run one CreatorHandle stack per server.
The deploy files are `compose.yml` (the services) plus `compose.prod.yml` (published ports and your domain).

## Server Preparation

1. Provision a Linux server with a public IP and open ports 80 and 443 (443/udp too, for HTTP/3).
2. Create an A/AAAA record for `yourdomain.com` pointing at the server. The site, the `/app` dashboard, `/@username` profiles and `/api` all share this one host, so no other records (and no wildcard record or certificate) are needed.
3. Install [Docker Engine](https://docs.docker.com/engine/install/) (not Docker Desktop).

## Step 2: Configure Environment Variables

On the server, create `/root/code/app/.env` from the committed template and fill it in (`.env.example` documents every variable):

```bash
cp .env.example .env
```

The backend refuses to start outside `ENVIRONMENT=local` while `SECRET_KEY`, `POSTGRES_PASSWORD`, `FIRST_SUPERUSER_PASSWORD` or `S3_SECRET_KEY` is still `changethis`. The production values look like this:

```bash
# Core
DOMAIN=yourdomain.com
ENVIRONMENT=production
PROJECT_NAME=creatorhandle
FRONTEND_HOST=https://yourdomain.com

# Security — generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=<generated>
FIRST_SUPERUSER=admin@yourdomain.com
FIRST_SUPERUSER_PASSWORD=<strong-password>

# Database
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>

# Email (use your real SMTP provider in production)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_TLS=True
SMTP_SSL=False
SMTP_USER=apikey
SMTP_PASSWORD=<smtp-password>
EMAILS_FROM_EMAIL=noreply@yourdomain.com

# Google OAuth (from Google Cloud Console > OAuth 2.0 Credentials)
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com

# CORS — the browser calls /api on the same origin, so this only matters for
# other origins you want to allow
BACKEND_CORS_ORIGINS="https://yourdomain.com"

# Optional
SENTRY_DSN=
# Logs are JSON lines outside ENVIRONMENT=local
LOG_LEVEL=INFO
# Uvicorn worker processes (default 2; each one costs memory)
WEB_CONCURRENCY=2

# Docker images
DOCKER_IMAGE_BACKEND=backend
DOCKER_IMAGE_FRONTEND=frontend
```

## Step 3: Deploy the App

Copy the project to the server:

```bash
rsync -av --filter=":- .gitignore" ./ root@your-server.com:/root/code/app/
```

Build and start (production uses `compose.yml` plus `compose.prod.yml`, not `compose.override.yml`):

```bash
cd /root/code/app
docker compose -f compose.yml -f compose.prod.yml up -d --build
```

The backend runs `alembic upgrade head` and creates the first superuser before it starts serving, so allow up to a minute on the first start. Caddy requests the certificate for `DOMAIN` as soon as it can be reached on port 80/443.

## Step 4: Verify

```bash
# Check all containers are healthy
docker compose -f compose.yml -f compose.prod.yml ps

# Check backend logs
docker compose -f compose.yml -f compose.prod.yml logs backend

# Smoke test: liveness, then readiness (database + storage)
curl https://yourdomain.com/api/v1/utils/health-check/
curl https://yourdomain.com/api/v1/utils/ready/
```

`/ready/` returns 503 with per-check status (`database`, `storage`) when a dependency is down; the backend container's healthcheck uses it.

Production URLs:

| Service | URL |
|---|---|
| Site / creator profiles | https://yourdomain.com, https://yourdomain.com/@username |
| Dashboard | https://yourdomain.com/app/ |
| API | https://yourdomain.com/api/v1/ |
| Swagger docs | https://yourdomain.com/docs |

## Google OAuth — Production Setup

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth 2.0 Client ID:

- **Authorized JavaScript origins:** `https://yourdomain.com`
- **Authorized redirect URIs:** not required for the implicit flow used here

Update `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` in `.env`, then rebuild the frontend (the client ID is baked into the bundle at build time).

## Upgrading from the `deploy/` layout (one time)

Until this restructure the Compose files lived in `deploy/` and were run as
`docker compose -f deploy/compose.yml ...`, which made the Compose project name
`deploy`. They now live at the repo root with an explicit project name,
`creatorhandle`. The data volumes are pinned to their old names
(`deploy_app-db-data`, `deploy_rustfs-data`, `deploy_caddy-*`), so no data
moves, but the old containers must be stopped once or the new frontend cannot
bind ports 80/443:

```bash
cd /root/code/app
git pull                                   # or rsync the new tree
mv deploy/.env .env                        # .env now lives at the repo root
docker compose -p deploy down              # old containers only; NO -v, volumes stay
docker compose -f compose.yml -f compose.prod.yml up -d --build
```

## Rotating secrets

Rotate a secret by changing it in `.env` and recreating the affected services.

- `SECRET_KEY`: `docker compose -f compose.yml -f compose.prod.yml up -d backend`. Every user is signed out.
- `POSTGRES_PASSWORD`: the database keeps its old password until you change it inside Postgres, so do that first:
  `docker compose -f compose.yml -f compose.prod.yml exec db psql -U postgres -c "ALTER USER postgres WITH PASSWORD '<new>'"`,
  then update `.env` and run `up -d backend db`.
- `FIRST_SUPERUSER_PASSWORD` only seeds a new database. To change an existing admin's password, log in and change it in the dashboard settings.
- `S3_SECRET_KEY`: RustFS reads it at start-up: update `.env`, then `up -d rustfs backend`.

## Updating the App

```bash
# Pull latest code
cd /root/code/app
git pull

# Rebuild and restart
docker compose -f compose.yml -f compose.prod.yml up -d --build
```

If there are database schema changes, Alembic runs automatically when the backend container starts.

## Database Migrations in Production

Migrations run automatically every time the backend container starts. To run them manually:

```bash
docker compose -f compose.yml -f compose.prod.yml exec backend alembic upgrade head
```

To check current migration state:

```bash
docker compose -f compose.yml -f compose.prod.yml exec backend alembic current
```

## Database access

There is no web DB admin tool in the stack. Use `psql`:

```bash
docker compose -f compose.yml -f compose.prod.yml exec db psql -U postgres app
```

## Image uploads (RustFS)

Creators can upload avatars, cover images and project thumbnails. They are stored in a private RustFS (S3-compatible) container and served publicly, read-only, at `https://yourdomain.com/media/...` by Caddy. Add credentials to `.env` before deploying (the stack will not start without them):

```bash
S3_ACCESS_KEY=creatorhandle
S3_SECRET_KEY=<long random secret>     # openssl rand -base64 24
```

The backend creates the `media` bucket on startup and allows anonymous reads of `images/*` only (no bucket listing, no writes). Uploads are checked, resized and re-encoded as WebP, so they carry no EXIF/GPS data. RustFS and its S3 API are not published on any host port.

**Existing deployments:** add the two `S3_*` variables to `.env`, then redeploy with `up -d --build`. Nothing else changes, and existing image links keep working.

## Backups

```bash
# Dump the database
docker compose -f compose.yml -f compose.prod.yml exec db pg_dump -U postgres app > backup_$(date +%Y%m%d).sql

# Restore
cat backup_YYYYMMDD.sql | docker compose -f compose.yml -f compose.prod.yml exec -T db psql -U postgres app

# Back up uploaded images (the volume is named deploy_rustfs-data, see compose.yml)
docker run --rm -v deploy_rustfs-data:/data -v "$(pwd)":/backup busybox tar czf /backup/images_$(date +%Y%m%d).tar.gz -C /data .
```

Back up the database and the image volume together: the database stores only the image paths.

## Migrating from the old Traefik setup

Older deployments ran a separate Traefik stack (`compose.traefik.yml`) on a shared `traefik-public` network, plus `prestart`, `adminer` and an nginx frontend (all removed). To switch:

```bash
# 1. Stop and remove the old Traefik stack so ports 80/443 are free
cd /root/code/traefik-public && docker compose -f compose.traefik.yml down

# 2. In .env: drop STACK_NAME, EMAIL, DASHBOARD_HOST, VITE_APP_DOMAIN, CORS_ALLOW_ORIGIN_REGEX, DNS_PROVIDER
#    and set FRONTEND_HOST=https://yourdomain.com

# 3. Start the new stack (this also removes the old prestart/adminer containers)
cd /root/code/app
docker compose -f compose.yml -f compose.prod.yml up -d --build --remove-orphans

# 4. Optionally clean up the old network and certificates volume
docker network rm traefik-public
```

The database volume is untouched. The `adminer.` and `traefik.` hostnames no longer exist. Caddy issues a fresh certificate on first start.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and push to `main`:
backend lint, mypy, `alembic check` and tests (Postgres + RustFS service
containers), frontend lint, type-check and build, a check that the generated
API clients are up to date, and a build of both Docker images. It does not
push images or deploy; deployment is the manual `up -d --build` above.
