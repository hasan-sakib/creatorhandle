# Docker Setup

All Docker Compose files live at the **project root** so that `docker compose` can resolve them automatically from the working directory.

## Compose Files

| File | Purpose |
|---|---|
| `compose.yml` | Main stack definition (db, backend, frontend, adminer) |
| `compose.override.yml` | Local development overrides — auto-applied when running `docker compose` locally (adds Traefik proxy, live-reload, mailcatcher, etc.) |
| `compose.traefik.yml` | Production Traefik reverse proxy with TLS/Let's Encrypt |

## Common Commands

```bash
# Start the full stack with hot-reload (local dev)
docker compose -f deploy/compose.yml watch

# View logs
docker compose -f deploy/compose.yml logs -f

# View logs for a specific service
docker compose -f deploy/compose.yml logs backend

# Stop everything
docker compose -f deploy/compose.yml down

# Stop and wipe database volumes
docker compose -f deploy/compose.yml down -v

# Production deploy (run on server)
docker compose -f deploy/compose.yml up -d
```

## Service URLs (local dev)

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Adminer (DB admin) | http://localhost:8080 |
| Mailcatcher | http://localhost:1080 |
| Traefik UI | http://localhost:8090 |

## Individual Dockerfiles

- `backend/Dockerfile` — Python / FastAPI image
- `frontend/Dockerfile` — React / Vite production image
- `frontend/Dockerfile.playwright` — E2E test runner image
