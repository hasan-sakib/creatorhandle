# CreatorHandle — Backend

FastAPI application with SQLModel ORM, PostgreSQL, JWT authentication, and Google OAuth.

## Stack

| Tool | Purpose |
|---|---|
| FastAPI 0.115 | API framework |
| SQLModel | ORM + Pydantic schema models |
| PostgreSQL 18 | Database |
| Alembic | Schema migrations |
| uv | Python package management |
| Pytest | Testing |
| Ruff | Linting + formatting |

## Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py          # FastAPI dependencies (auth, session)
│   │   ├── main.py          # API router aggregation
│   │   └── routes/
│   │       ├── login.py     # JWT + Google OAuth endpoints
│   │       ├── users.py     # User CRUD
│   │       ├── brands.py    # Brand management
│   │       ├── projects.py  # Project management
│   │       ├── tasks.py     # Task management
│   │       ├── items.py     # Item management
│   │       ├── public.py    # Public creator profile (no auth)
│   │       ├── utils.py     # Health check, test email
│   │       └── private.py   # Test helpers (local env only)
│   ├── core/
│   │   ├── config.py        # Settings (loaded from env vars)
│   │   ├── db.py            # Database engine + session
│   │   └── security.py      # Password hashing, JWT generation
│   ├── alembic/
│   │   └── versions/        # Migration scripts
│   ├── models.py            # All SQLModel table + schema models
│   ├── crud.py              # Database operations
│   ├── main.py              # App factory, CORS, Sentry
│   ├── initial_data.py      # Seeds first superuser
│   └── backend_pre_start.py # Waits for DB, runs on container start
├── tests/
├── scripts/
│   ├── prestart.sh          # Alembic upgrade + initial_data
│   └── tests-start.sh       # Wait for DB, run pytest
└── pyproject.toml
```

## API Endpoints

All routes are under `/api/v1/`.

### Authentication (`/api/v1/`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login/access-token` | None | Email + password login → JWT |
| POST | `/login/google` | None | Google OAuth access token → JWT |
| POST | `/login/test-token` | JWT | Validate current token |
| POST | `/password-recovery/{email}` | None | Send recovery email |
| POST | `/reset-password/` | None | Reset password with token |

### Users (`/api/v1/users/`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Superuser | List all users |
| POST | `/` | Superuser | Create user |
| GET | `/me` | JWT | Get current user |
| PATCH | `/me` | JWT | Update profile |
| PATCH | `/me/password` | JWT | Change password |
| DELETE | `/me` | JWT | Delete own account |
| POST | `/signup` | None | Self-registration |
| GET | `/{user_id}` | JWT | Get user by ID |
| PATCH | `/{user_id}` | Superuser | Update any user |
| DELETE | `/{user_id}` | Superuser | Delete any user |

### Brands, Projects, Tasks, Items

Standard CRUD pattern for each resource:

```
GET    /api/v1/{resource}/          List owned records (paginated)
POST   /api/v1/{resource}/          Create record
GET    /api/v1/{resource}/{id}      Get by ID
PUT    /api/v1/{resource}/{id}      Update
DELETE /api/v1/{resource}/{id}      Delete
```

### Public (`/api/v1/public/`) — no authentication
| Method | Path | Description |
|---|---|---|
| GET | `/{username}` | Creator profile + stats |
| GET | `/{username}/brands` | Creator's active brands |
| GET | `/{username}/projects` | Creator's non-cancelled projects |

## Data Models

```python
User
  id: UUID (PK)
  email: str (unique)
  username: str | None (unique, used for public profile URL)
  full_name: str | None
  hashed_password: str | None  # None for Google-only accounts
  is_active: bool
  is_superuser: bool
  created_at: datetime

Brand
  id: UUID (PK)
  name: str
  description: str | None
  owner_id: UUID (FK → User)

Project
  id: UUID (PK)
  name: str
  description: str | None
  status: str
  brand_id: UUID (FK → Brand)
  owner_id: UUID (FK → User)

Task
  id: UUID (PK)
  title: str
  description: str | None
  status: str
  project_id: UUID (FK → Project)
  owner_id: UUID (FK → User)

Item
  id: UUID (PK)
  title: str
  description: str | None
  owner_id: UUID (FK → User)
```

Relationships use cascade deletes: deleting a User deletes all their Brands, Projects, Tasks, and Items. Deleting a Brand deletes its Projects. Deleting a Project deletes its Tasks.

## Local Setup

```bash
cd backend
uv sync
source .venv/bin/activate
```

## Running Tests

```bash
# Via Docker (uses real database)
docker compose -f ../deploy/compose.yml -f ../deploy/compose.override.yml exec backend bash scripts/tests-start.sh

# With extra pytest args
docker compose -f ../deploy/compose.yml -f ../deploy/compose.override.yml exec backend bash scripts/tests-start.sh -x -v
```

Coverage report: `backend/htmlcov/index.html`

## Database Migrations

```bash
# Shell into the backend container
docker compose -f ../deploy/compose.yml -f ../deploy/compose.override.yml exec backend bash

# Generate a migration after changing models.py
alembic revision --autogenerate -m "add column foo to bar"

# Apply all pending migrations
alembic upgrade head

# Check current state
alembic current

# Rollback one step
alembic downgrade -1
```

Always commit the generated migration file to the repository.

## Configuration

Settings are loaded from environment variables via Pydantic Settings (`app/core/config.py`). Key settings:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | — | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 10080 (7 days) | Token lifetime |
| `GOOGLE_CLIENT_ID` | `""` | Google OAuth client ID |
| `POSTGRES_SERVER` | `localhost` | DB host |
| `POSTGRES_PORT` | 5432 | DB port |
| `POSTGRES_DB` | `app` | DB name |
| `BACKEND_CORS_ORIGINS` | — | Allowed CORS origins |
| `ENVIRONMENT` | `local` | `local` / `staging` / `production` |
| `SMTP_HOST` | — | SMTP server for emails |

In non-local environments, `SECRET_KEY` and `POSTGRES_PASSWORD` must not be the default placeholder values — the app raises an error on startup if they are.

## Email Templates

Password recovery emails use MJML templates in `app/email-templates/`. Edit `.mjml` source files in `src/`, then export to HTML using the [VS Code MJML extension](https://github.com/mjmlio/vscode-mjml) and save the output to `build/`.
