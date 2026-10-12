# CreatorHandle — Deployment Guide

## Overview

Production is three containers managed by Docker Compose:

| Service | What it is |
|---|---|
| `frontend` | [Caddy](https://caddyserver.com/): serves both SPAs, proxies `/api`, `/docs` and `/redoc` to the backend, and obtains/renews the TLS certificate for `DOMAIN` automatically (Let's Encrypt) |
| `backend` | FastAPI. Waits for the DB, runs `alembic upgrade head` and seeds the first superuser on every start, then serves |
| `db` | PostgreSQL |

There is no separate reverse-proxy stack: Caddy owns ports 80 and 443 on the server, so run one CreatorHandle stack per server.
The deploy files are `deploy/compose.yml` (the services) plus `deploy/compose.prod.yml` (published ports and your domain).

## Server Preparation

1. Provision a Linux server with a public IP and open ports 80 and 443 (443/udp too, for HTTP/3).
2. Create an A/AAAA record for `yourdomain.com` pointing at the server. The site, the `/app` dashboard, `/@username` profiles and `/api` all share this one host, so no other records (and no wildcard record or certificate) are needed.
3. Install [Docker Engine](https://docs.docker.com/engine/install/) (not Docker Desktop).

## Step 2: Configure Environment Variables

On the server, set required variables. The recommended approach is to write them into a `.env` file at `/root/code/app/deploy/.env`:

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
docker compose -f deploy/compose.yml -f deploy/compose.prod.yml up -d --build
```

The backend runs `alembic upgrade head` and creates the first superuser before it starts serving, so allow up to a minute on the first start. Caddy requests the certificate for `DOMAIN` as soon as it can be reached on port 80/443.

## Step 4: Verify

```bash
# Check all containers are healthy
docker compose -f deploy/compose.yml -f deploy/compose.prod.yml ps

# Check backend logs
docker compose -f deploy/compose.yml -f deploy/compose.prod.yml logs backend

# Smoke test the API
curl https://yourdomain.com/api/v1/utils/health-check/
```

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

## Updating the App

```bash
# Pull latest code
cd /root/code/app
git pull

# Rebuild and restart
docker compose -f deploy/compose.yml -f deploy/compose.prod.yml up -d --build
```

If there are database schema changes, Alembic runs automatically when the backend container starts.

## Database Migrations in Production

Migrations run automatically every time the backend container starts. To run them manually:

```bash
docker compose -f deploy/compose.yml -f deploy/compose.prod.yml exec backend alembic upgrade head
```

To check current migration state:

```bash
docker compose -f deploy/compose.yml -f deploy/compose.prod.yml exec backend alembic current
```

## Database access

There is no web DB admin tool in the stack. Use `psql`:

```bash
docker compose -f deploy/compose.yml -f deploy/compose.prod.yml exec db psql -U postgres app
```

## Backups

```bash
# Dump the database
docker compose -f deploy/compose.yml -f deploy/compose.prod.yml exec db pg_dump -U postgres app > backup_$(date +%Y%m%d).sql

# Restore
cat backup_YYYYMMDD.sql | docker compose -f deploy/compose.yml -f deploy/compose.prod.yml exec -T db psql -U postgres app
```

## Migrating from the old Traefik setup

Older deployments ran a separate Traefik stack (`compose.traefik.yml`) on a shared `traefik-public` network, plus `prestart`, `adminer` and an nginx frontend (all removed). To switch:

```bash
# 1. Stop and remove the old Traefik stack so ports 80/443 are free
cd /root/code/traefik-public && docker compose -f compose.traefik.yml down

# 2. In deploy/.env: drop STACK_NAME, EMAIL, DASHBOARD_HOST, VITE_APP_DOMAIN, CORS_ALLOW_ORIGIN_REGEX, DNS_PROVIDER
#    and set FRONTEND_HOST=https://yourdomain.com

# 3. Start the new stack (this also removes the old prestart/adminer containers)
cd /root/code/app
docker compose -f deploy/compose.yml -f deploy/compose.prod.yml up -d --build --remove-orphans

# 4. Optionally clean up the old network and certificates volume
docker network rm traefik-public
```

The database volume is untouched. The `adminer.` and `traefik.` hostnames no longer exist. Caddy issues a fresh certificate on first start.

## Continuous Deployment with GitHub Actions

The repository is set up for automated deployments via a self-hosted GitHub Actions runner.

### Runner Setup

On the remote server:

```bash
# Create a dedicated user
sudo adduser github
sudo usermod -aG docker github

# Install GitHub Actions runner following the official guide
# https://docs.github.com/en/actions/hosting-your-own-runners/adding-self-hosted-runners
sudo su - github
# ... follow the installation instructions ...

# Install as a system service (run as root)
exit
cd /home/github/actions-runner
./svc.sh install github
./svc.sh start
```

### GitHub Secrets

Configure these secrets in your repository (Settings → Secrets and variables → Actions):

| Secret | Description |
|---|---|
| `DOMAIN_PRODUCTION` | Production domain |
| `DOMAIN_STAGING` | Staging domain |
| `STACK_NAME_PRODUCTION` | Docker Compose project name for production |
| `STACK_NAME_STAGING` | Docker Compose project name for staging |
| `SECRET_KEY` | JWT signing secret |
| `POSTGRES_PASSWORD` | Database password |
| `FIRST_SUPERUSER` | Admin email |
| `FIRST_SUPERUSER_PASSWORD` | Admin password |
| `EMAILS_FROM_EMAIL` | From address for outbound emails |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_GOOGLE_CLIENT_ID` | Same value as `GOOGLE_CLIENT_ID` |

### Deployment Triggers

- Push or merge to `master` → deploys to **staging**
- Publish a GitHub release → deploys to **production**
