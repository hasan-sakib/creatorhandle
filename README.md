# CreatorHandle

A full-stack creator management platform. Creators get a **private workspace dashboard** to manage their brands, projects, tasks, and team — plus a **public profile page** that showcases their work to the world.

---

## Overview

CreatorHandle gives content creators and agencies a single hub to:

- Organize brands, projects, and tasks in one place
- Track project progress and deadlines
- Assign tasks to named collaborators (team members)
- Share a polished public profile page with potential clients

The platform is split into two frontends backed by a single FastAPI/PostgreSQL API:

| App | Purpose |
|---|---|
| **creator-workspace** | Private dashboard — auth-protected, full CRUD for all entities |
| **creator-site** | Public profile — no auth, displays creator's portfolio to visitors |

---

## Architecture

```mermaid
graph TB
    subgraph Client["Browser"]
        WS["creator-workspace<br/>(Dashboard SPA)<br/>React + TanStack Router"]
        CS["creator-site<br/>(Public Profile SPA)<br/>React + TanStack Router"]
    end

    subgraph Proxy["Traefik Reverse Proxy"]
        T["SSL Termination<br/>& Routing"]
    end

    subgraph Backend["FastAPI Backend"]
        API["REST API<br/>/api/v1/"]
        AUTH["Auth<br/>JWT + Google OAuth"]
        ROUTES["Routes<br/>brands · projects · tasks<br/>collaborators · items · public"]
    end

    subgraph DB["Data Layer"]
        PG["PostgreSQL 18<br/>(SQLModel ORM)"]
        ALM["Alembic<br/>Migrations"]
    end

    subgraph Infra["Infrastructure"]
        MAIL["Mailcatcher<br/>(Dev SMTP)"]
        ADM["Adminer<br/>(DB Admin UI)"]
    end

    WS -->|"HTTPS (auth)"| T
    CS -->|"HTTPS (public)"| T
    T --> API
    API --> AUTH
    AUTH --> ROUTES
    ROUTES --> PG
    ALM --> PG
    API --> MAIL
    ADM --> PG
```

### Data Model

```mermaid
erDiagram
    USER {
        uuid id PK
        string email
        string username
        string full_name
        string bio
        string website
        string twitter
        string instagram
        string youtube
        string tiktok
        bool is_superuser
    }
    BRAND {
        uuid id PK
        string name
        string category
        string status
        string contact_name
        string contact_email
        uuid owner_id FK
    }
    PROJECT {
        uuid id PK
        string title
        string type
        string platform_status
        date deadline
        uuid owner_id FK
        uuid brand_id FK
    }
    TASK {
        uuid id PK
        string title
        string status
        string priority
        date due_date
        uuid owner_id FK
        uuid project_id FK
        uuid collaborator_id FK
    }
    COLLABORATOR {
        uuid id PK
        string name
        string role
        uuid owner_id FK
    }

    USER ||--o{ BRAND : owns
    USER ||--o{ PROJECT : owns
    USER ||--o{ TASK : owns
    USER ||--o{ COLLABORATOR : owns
    BRAND ||--o{ PROJECT : has
    PROJECT ||--o{ TASK : contains
    COLLABORATOR ||--o{ TASK : assigned_to
```

### Request Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant T as Traefik
    participant F as FastAPI
    participant D as PostgreSQL

    B->>T: HTTPS request
    T->>F: Forward to backend
    F->>F: Validate JWT
    F->>D: Query (SQLModel)
    D-->>F: Result rows
    F-->>B: JSON response

    Note over B,F: Public profile endpoints skip JWT validation
```

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Framework | [FastAPI](https://fastapi.tiangolo.com/) 0.114+ |
| Language | Python 3.12+ |
| ORM | [SQLModel](https://sqlmodel.tiangolo.com/) + SQLAlchemy |
| Database | PostgreSQL 18 |
| Migrations | Alembic |
| Auth | PyJWT · pwdlib (bcrypt/argon2) · Google OAuth 2.0 |
| Validation | Pydantic v2 |
| Email | Jinja2 templates + SMTP |
| Package manager | [uv](https://docs.astral.sh/uv/) |

### Frontend (both apps)

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Router | [TanStack Router](https://tanstack.com/router) v1 (file-based) |
| Server state | [TanStack Query](https://tanstack.com/query) v5 |
| Forms | React Hook Form 7 + Zod |
| UI components | [shadcn/ui](https://ui.shadcn.com/) + Radix UI primitives |
| Styling | Tailwind CSS v4 |
| HTTP client | Axios (auto-generated OpenAPI client) |
| Build tool | Vite 7 + SWC |
| Package manager | [Bun](https://bun.sh/) |
| Linting | Biome |

### Infrastructure

| Service | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Reverse proxy | [Traefik](https://traefik.io/) (SSL, routing) |
| DB admin | Adminer |
| Dev email | Mailcatcher |
| Error tracking | Sentry SDK |

---


## Documentation

- [Local Development Guide](docs/development.md)
- [Deployment Guide](docs/deployment.md)
- [Backend Guide](backend/README.md)
- [Frontend Guide](frontend/README.md)
- [Security Policy](docs/SECURITY.md)

---

## License

MIT
