# CreatorHandle — Deployment Guide

## Overview

Production uses Docker Compose with Traefik as the public-facing reverse proxy. Traefik handles TLS termination and certificate renewal via Let's Encrypt. The app stack runs behind it on a private Docker network.

## Server Preparation

1. Provision a Linux server with a public IP.
2. Point your domain's DNS at that IP. Configure a wildcard subdomain (`*.yourdomain.com`) to cover `api.`, `dashboard.`, `adminer.`, `traefik.`.
3. Install [Docker Engine](https://docs.docker.com/engine/install/) (not Docker Desktop).

## Step 1: Set Up Public Traefik

This Traefik instance lives outside the app stack and handles all incoming HTTPS traffic. It only needs to be set up once per server.

```bash
# On the remote server
mkdir -p /root/code/traefik-public
```

Copy `deploy/compose.traefik.yml` to `/root/code/traefik-public/` on the server:

```bash
rsync -a deploy/compose.traefik.yml root@your-server.com:/root/code/traefik-public/
```

Create the shared Docker network:

```bash
docker network create traefik-public
```

Set required environment variables and start Traefik:

```bash
export DOMAIN=yourdomain.com
export USERNAME=admin
export PASSWORD=your-traefik-dashboard-password
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
export EMAIL=admin@yourdomain.com

cd /root/code/traefik-public
docker compose -f compose.traefik.yml up -d
```

## Step 2: Configure Environment Variables

On the server, set required variables. The recommended approach is to write them into a `.env` file at `/root/code/app/deploy/.env`:

```bash
# Core
DOMAIN=yourdomain.com
ENVIRONMENT=production
PROJECT_NAME=creatorhandle
STACK_NAME=creatorhandle
FRONTEND_HOST=https://dashboard.yourdomain.com

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

# CORS — include your production frontend URL
BACKEND_CORS_ORIGINS="https://dashboard.yourdomain.com"

# Optional
SENTRY_DSN=

# Docker images
DOCKER_IMAGE_BACKEND=backend
DOCKER_IMAGE_FRONTEND=frontend
```

## Step 3: Deploy the App

Copy the project to the server:

```bash
rsync -av --filter=":- .gitignore" ./ root@your-server.com:/root/code/app/
```

Build and start (production only uses `compose.yml`, not `compose.override.yml`):

```bash
cd /root/code/app
docker compose -f deploy/compose.yml build
docker compose -f deploy/compose.yml up -d
```

The `prestart` container automatically runs `alembic upgrade head` and creates the first superuser before the backend accepts traffic.

## Step 4: Verify

```bash
# Check all containers are healthy
docker compose -f deploy/compose.yml ps

# Check backend logs
docker compose -f deploy/compose.yml logs backend

# Smoke test the API
curl https://api.yourdomain.com/api/v1/utils/health-check/
```

Production URLs:

| Service | URL |
|---|---|
| Dashboard | https://dashboard.yourdomain.com |
| Backend API | https://api.yourdomain.com |
| Swagger docs | https://api.yourdomain.com/docs |
| Adminer | https://adminer.yourdomain.com |
| Traefik dashboard | https://traefik.yourdomain.com |

## Google OAuth — Production Setup

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth 2.0 Client ID:

- **Authorized JavaScript origins:** `https://dashboard.yourdomain.com`
- **Authorized redirect URIs:** not required for the implicit flow used here

Update `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` in `.env`, then rebuild the frontend (the client ID is baked into the bundle at build time).

## Updating the App

```bash
# Pull latest code
cd /root/code/app
git pull

# Rebuild and restart
docker compose -f deploy/compose.yml build
docker compose -f deploy/compose.yml up -d
```

If there are database schema changes, Alembic runs automatically on container start via the `prestart` service.

## Database Migrations in Production

Migrations run automatically via the `prestart` service every time the stack starts. To run them manually:

```bash
docker compose -f deploy/compose.yml exec backend alembic upgrade head
```

To check current migration state:

```bash
docker compose -f deploy/compose.yml exec backend alembic current
```

## Backups

```bash
# Dump the database
docker compose -f deploy/compose.yml exec db pg_dump -U postgres app > backup_$(date +%Y%m%d).sql

# Restore
cat backup_YYYYMMDD.sql | docker compose -f deploy/compose.yml exec -T db psql -U postgres app
```

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
