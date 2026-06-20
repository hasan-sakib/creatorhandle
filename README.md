# CreatorHandle

A full-stack creator management platform. Creators get a personal public profile page and a private workspace dashboard to manage their brands, projects, and tasks.

## Quick Start

**Requirements:** [Docker](https://www.docker.com/), [Bun](https://bun.sh/), [uv](https://docs.astral.sh/uv/)

```bash
# Start all services (backend, db, frontend, mailcatcher, traefik)
docker compose -f deploy/compose.yml -f deploy/compose.override.yml up -d

# Watch for backend changes with live reload
docker compose -f deploy/compose.yml -f deploy/compose.override.yml watch
```

| Service | URL |
|---|---|
| Dashboard (workspace) | http://localhost:5173 |
| Public profile | http://localhost:5173/creator/{username} |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Adminer (DB admin) | http://localhost:8080 |
| Mailcatcher | http://localhost:1080 |
| Traefik UI | http://localhost:8090 |

## Documentation

- [Project Overview & Architecture](docs/README.md)
- [Local Development Guide](docs/development.md)
- [Deployment Guide](docs/deployment.md)
- [Backend Guide](backend/README.md)
- [Frontend Guide](frontend/README.md)
- [Docker Setup](docker/README.md)
- [Security Policy](docs/SECURITY.md)

## Environment Setup

Copy `deploy/.env` and fill in required values before first run:

```bash
SECRET_KEY=          # python -c "import secrets; print(secrets.token_urlsafe(32))"
POSTGRES_PASSWORD=   # any strong password
FIRST_SUPERUSER=     # admin email
FIRST_SUPERUSER_PASSWORD=
GOOGLE_CLIENT_ID=    # from Google Cloud Console (OAuth 2.0 Web client)
VITE_GOOGLE_CLIENT_ID= # same value as GOOGLE_CLIENT_ID
```

## License

MIT
