# CreatorHandle — Frontend

Two independent React + Vite applications managed as a Bun workspace:

| App | Directory | Served at | Purpose |
|---|---|---|---|
| creator-workspace | `creator-workspace/` | `/` | Authenticated dashboard |
| creator-site | `creator-site/` | `/creator/` | Public creator profiles |

Both apps are built and served by a single Nginx Docker container. In production, nginx routes `/creator/*` to creator-site and everything else to creator-workspace.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TanStack Router | v1 | File-based routing |
| TanStack Query | v5 | Server state management |
| TanStack Table | v8 | Data tables (workspace only) |
| Tailwind CSS | v4 | Styling |
| shadcn/ui | latest | Component library |
| Vite | v7 | Build tool |
| TypeScript | v5 | Type safety |
| Bun | latest | Package manager + runner |
| Biome | v2 | Linting + formatting |
| Playwright | 1.57 | E2E tests (workspace only) |
| @react-oauth/google | ^0.12.1 | Google Sign-In |

## Requirements

- [Bun](https://bun.sh/) — `curl -fsSL https://bun.sh/install | bash`

## Quick Start

```bash
# Install all workspace dependencies
bun install

# Start creator-workspace dev server (http://localhost:5173)
cd frontend/creator-workspace && bun run dev

# Start creator-site dev server
cd frontend/creator-site && bun run dev
```

The dev servers talk directly to the backend at `http://localhost:8000` (set in `VITE_API_URL`).

## Directory Structure

### creator-workspace (dashboard)

```
creator-workspace/src/
├── client/              # Auto-generated OpenAPI TypeScript client
│   ├── sdk.gen.ts       # Service classes (LoginService, UsersService, etc.)
│   └── types.gen.ts     # Request/response types
├── components/
│   ├── ui/              # shadcn/ui primitives + custom components
│   │   └── animated-characters-login-page.tsx
│   ├── workspace/       # Dashboard-specific components
│   └── Common/          # Shared: NotFound, ErrorComponent, Logo
├── hooks/
│   ├── useAuth.ts       # Login mutation, logout, current user query
│   └── useCustomToast.ts
├── routes/
│   ├── __root.tsx       # Root route (ErrorBoundary, HeadContent)
│   ├── _layout.tsx      # Protected layout (sidebar, header)
│   ├── _layout/         # Authenticated pages
│   │   ├── index.tsx    # Dashboard
│   │   ├── brands.tsx
│   │   ├── projects.tsx
│   │   ├── tasks.tsx
│   │   ├── items.tsx
│   │   ├── settings.tsx
│   │   └── admin.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   ├── recover-password.tsx
│   └── reset-password.tsx
├── routeTree.gen.ts     # Manually maintained route tree
└── main.tsx             # App entry: GoogleOAuthProvider, Router, QueryClient
```

### creator-site (public profiles)

```
creator-site/src/
├── components/
│   ├── creator/         # Profile-specific components
│   └── Common/          # Logo, NotFound
├── routes/
│   ├── __root.tsx
│   └── $username.tsx    # /$username → /creator/:username
├── routeTree.gen.ts
└── main.tsx             # basepath: "/creator"
```

## Authentication

The workspace uses JWT stored in `localStorage` under `access_token`. Two login methods:

**Email + password:**
```tsx
loginMutation.mutate({ username: email, password })
```

**Google Sign-In (implicit flow):**
```tsx
const triggerGoogleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    const res = await LoginService.loginWithGoogle({ body: { token: tokenResponse.access_token } })
    localStorage.setItem("access_token", res.access_token)
    navigate({ to: "/" })
  },
})
```

`GoogleOAuthProvider` wraps the entire app in `main.tsx`. Requires `VITE_GOOGLE_CLIENT_ID` to be set at build time.

## Cross-App Navigation

creator-site runs at basepath `/creator`. Links that navigate outside creator-site (e.g. to the login page) must use plain `<a>` tags, not TanStack Router `<Link>`:

```tsx
// Correct
<a href="/login">Log in</a>

// Wrong — resolves to /creator/login
<Link to="/login">Log in</Link>
```

## Building for Docker

Both apps are built as part of the frontend Docker image. Build args that must be provided:

| Arg | Description |
|---|---|
| `VITE_API_URL` | Backend URL (e.g. `http://localhost:8000`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (baked into bundle) |

```bash
# Rebuild with updated env vars
docker compose -f deploy/compose.yml -f deploy/compose.override.yml build --no-cache frontend
docker compose -f deploy/compose.yml -f deploy/compose.override.yml up -d frontend
```

## Nginx Routing

`frontend/nginx.conf` — path-based routing in the single nginx container:

```nginx
location /creator/ → creator-site dist   (try_files → /creator/index.html)
location /         → creator-workspace dist (try_files → /index.html)
location /api      → 404  (API is on a separate port)
```

## Regenerating the API Client

After changing backend endpoints, regenerate the TypeScript client:

```bash
# Requires the backend to be running at localhost:8000
bash scripts/generate-client.sh

# Or manually
curl http://localhost:8000/api/v1/openapi.json > frontend/creator-workspace/openapi.json
cd frontend/creator-workspace && bun run generate-client
```

Commit the changes in `frontend/creator-workspace/src/client/`.

## E2E Tests (Playwright)

```bash
# Requires backend + frontend Docker containers running
cd frontend/creator-workspace

# Run all tests
bunx playwright test

# Interactive UI
bunx playwright test --ui

# Clean up after tests
docker compose -f ../../deploy/compose.yml -f ../../deploy/compose.override.yml down -v
```

## Linting

```bash
# From within an app directory
bun run lint

# Or run biome directly
bunx biome check --write ./
```
