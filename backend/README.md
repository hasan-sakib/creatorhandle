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
| Ruff, mypy (strict) | Linting, formatting, type-checking |

## Directory Structure

```
backend/
├── Dockerfile                multi-stage image, non-root runtime
├── pyproject.toml            deps + ruff/mypy/coverage config (uv workspace member)
├── alembic.ini
├── app/
│   ├── main.py               app wiring: logging, CORS, request logs, Sentry, routers
│   ├── api/
│   │   ├── deps.py           session, current user, workspace membership/permission deps
│   │   ├── main.py           router aggregation
│   │   └── routes/           one module per resource (thin HTTP layer)
│   ├── core/                 infrastructure only
│   │   ├── config.py         typed settings from env / repo-root .env
│   │   ├── db.py             engine
│   │   ├── security.py       password hashing, access + reset tokens
│   │   ├── log.py            logging setup + request logging middleware
│   │   ├── storage.py        S3 (RustFS) client
│   │   └── media.py          /media path layout and ownership
│   ├── domain/               business rules
│   │   ├── permissions.py    roles -> permissions, member statuses
│   │   ├── validators.py     profile/portfolio field validation, theme/accent keys
│   │   └── images.py         upload decoding, resizing, WebP encoding
│   ├── models/               SQLModel tables + API schemas, one module per domain
│   ├── crud/                 persistence helpers (user, workspace, item)
│   ├── emails/               email rendering/sending; templates/{src,build}
│   ├── cli/                  start-up commands: pre_start, storage_init, initial_data, tests_pre_start
│   └── alembic/versions/     migrations
├── scripts/                  entrypoint.sh, prestart.sh, tests-start.sh, test.sh
└── tests/                    api/routes, crud, cli, utils (helpers), conftest.py
```

`from app.models import X` and `from app import crud` re-export everything,
so imports don't depend on which module a class lives in.

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

### Workspaces (`/api/v1/workspaces/`)

List/create workspaces, read/update/delete one (`/{id}`), and manage members
(`/{id}/members`, `/{id}/members/{user_id}`). Member roles are
owner/admin/manager/member/viewer (see `app/domain/permissions.py`); only an
owner can grant ownership or change an owner, and the last owner can't be
demoted, deactivated or removed.

### Brands, Projects, Tasks, Collaborators, Items

Standard CRUD pattern for each resource. Brands, projects, tasks and
collaborators are scoped to the workspace in the `X-Workspace-Id` header, and
references between them (a project's brand, a task's project, collaborator or
assignee) must belong to that same workspace.

```
GET    /api/v1/{resource}/          List records in the workspace (paginated)
POST   /api/v1/{resource}/          Create record
GET    /api/v1/{resource}/{id}      Get by ID
PUT    /api/v1/{resource}/{id}      Update
DELETE /api/v1/{resource}/{id}      Delete
```

### Uploads (`/api/v1/uploads/`) — authentication required
| Method | Path | Description |
|---|---|---|
| POST | `/images` | Upload an avatar, cover or project thumbnail (`multipart/form-data`: `file`, `kind`). Returns `{url, width, height}`; `url` is a site-relative `/media/...` path |

Images are re-encoded to WebP and stored in S3-compatible storage (RustFS). See `app/domain/images.py`, `app/core/storage.py` and `app/core/media.py`.

### Utils (`/api/v1/utils/`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health-check/` | None | Liveness: always `true` |
| GET | `/ready/` | None | Readiness: database (and storage, if configured); 503 with per-check status when one is down |
| POST | `/test-email/` | Superuser | Send a test email |

### Public (`/api/v1/public/`) — no authentication
| Method | Path | Description |
|---|---|---|
| GET | `/{username}` | The whole portfolio in one response: profile (headline, about, niches, content formats, platforms, services, work style, availability, links, cover/avatar, theme, accent color, default color mode), the creator's **Published** projects (featured first, max 60) and the brands tied to them |

The response schemas (`PublicCreator`, `PublicBrand`, `PublicProject` in `app/api/routes/public.py`) are standalone on purpose, so a new private column can never leak. Brand notes and contacts, project status/deadline, tasks and internal ids are never returned. Unpublished or unknown creators get 404. The response is cacheable for 30 s.

## Data Models

Defined in `app/models/` (one module per domain). In short: a **User** joins
**Workspaces** through **WorkspaceMember** (role + status) and gets a personal
workspace on sign-up. **Brands**, **Projects**, **Tasks** and
**Collaborators** belong to a workspace; a project may link a brand, a task
may link a project, a collaborator and an assignee. Deleting a brand deletes
its projects and their tasks; deleting a collaborator unassigns their tasks.
**Item** is the original template's example resource (per user). The User
row also holds the public portfolio fields (headline, about, niches,
services, work style, theme, accent, ...); `hashed_password` is null for
Google-only accounts.

## Local Setup

```bash
uv sync --all-packages        # from the repo root; creates .venv (Python 3.12)
```

Lint, format and type-check with `make lint`, `make format`, `make typecheck`
(ruff + mypy strict).

## Running Tests

```bash
make test                     # pytest in the dev container, with coverage
```

Tests run against a separate `<POSTGRES_DB>_test` database that
`scripts/tests-start.sh` creates and migrates. The test session deletes all
users when it ends, so `tests/conftest.py` refuses to run against a database
whose name doesn't end in `_test`. Coverage report: `backend/htmlcov/index.html`.

## Database Migrations

```bash
make migration m="add column foo to bar"   # autogenerate on the host (db must be up)
make migrate                               # alembic upgrade head in the container
docker compose exec backend alembic current
docker compose exec backend alembic downgrade -1
```

Always commit the generated migration file. CI runs `alembic check`.

## Configuration

Settings are loaded from environment variables via Pydantic Settings (`app/core/config.py`). Key settings:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | — | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 11520 (8 days) | Token lifetime |
| `GOOGLE_CLIENT_ID` | `""` | Google OAuth client ID; when set, Google tokens must be issued to it |
| `LOG_LEVEL` | `INFO` | Text logs locally, JSON lines elsewhere |
| `POSTGRES_SERVER` | `localhost` | DB host |
| `POSTGRES_PORT` | 5432 | DB port |
| `POSTGRES_DB` | `app` | DB name |
| `BACKEND_CORS_ORIGINS` | — | Allowed CORS origins |
| `ENVIRONMENT` | `local` | `local` / `staging` / `production` |
| `SMTP_HOST` | — | SMTP server for emails |

`.env` is read from the repo root regardless of the working directory; every
variable is documented in `/.env.example`. In non-local environments
`SECRET_KEY`, `POSTGRES_PASSWORD`, `FIRST_SUPERUSER_PASSWORD` and
`S3_SECRET_KEY` must not be `changethis`; the app refuses to start if they are.

## Email Templates

Password recovery emails use MJML templates in `app/emails/templates/`. Edit `.mjml` source files in `src/`, then export to HTML using the [VS Code MJML extension](https://github.com/mjmlio/vscode-mjml) and save the output to `build/`.
