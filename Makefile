# Common tasks. Run `make` (or `make help`) for the list.
# Needs: docker (with compose), uv, bun.
# Python deps live in backend/ (uv), JS deps in frontend/ (bun workspace).

.DEFAULT_GOAL := help
SHELL := /bin/bash

COMPOSE      := docker compose
COMPOSE_PROD := docker compose -f compose.yml -f compose.prod.yml

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# --- Setup -------------------------------------------------------------------

.PHONY: setup
setup: ## Install deps (uv + bun), git hooks, and create .env if missing
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example; fill in the secrets.")
	cd backend && uv sync
	cd frontend && bun install --frozen-lockfile
	uv run --project backend prek install

# --- Run ---------------------------------------------------------------------

.PHONY: up
up: ## Start the full dev stack in the background (http://localhost:5173)
	$(COMPOSE) up -d --build --wait

.PHONY: dev
dev: ## Start the dev stack with backend live-sync (foreground)
	$(COMPOSE) watch

.PHONY: down
down: ## Stop the stack (keeps data volumes)
	$(COMPOSE) down

.PHONY: logs
logs: ## Follow logs (s=<service> for one service)
	$(COMPOSE) logs -f $(s)

.PHONY: ps
ps: ## Show service status
	$(COMPOSE) ps

.PHONY: dev-backend
dev-backend: ## Run the API on the host with reload (first: docker compose stop backend)
	cd backend && POSTGRES_SERVER=localhost uv run fastapi dev app/main.py

.PHONY: dev-workspace
dev-workspace: ## Run the dashboard Vite dev server
	cd frontend && bun run dev:workspace

.PHONY: dev-site
dev-site: ## Run the public site Vite dev server
	cd frontend && bun run dev:site

# --- Quality -----------------------------------------------------------------

.PHONY: lint
lint: ## Lint + format check (ruff, biome)
	cd backend && uv run ruff check app tests && uv run ruff format --check app tests
	cd frontend && bun run lint:ci

.PHONY: format
format: ## Auto-fix lint and formatting (ruff, biome)
	cd backend && uv run ruff check --fix app tests && uv run ruff format app tests
	cd frontend && bun run lint

.PHONY: typecheck
typecheck: ## Type-check (mypy, tsc)
	cd backend && uv run mypy app
	cd frontend && bun run typecheck

.PHONY: check
check: lint typecheck ## lint + typecheck

# --- Tests -------------------------------------------------------------------

.PHONY: test
test: ## Backend tests in the dev container, against a separate *_test database
	$(COMPOSE) exec -T backend bash scripts/tests-start.sh

.PHONY: test-e2e
test-e2e: ## Playwright e2e tests against the running stack (`make up` first)
	cd frontend && bun run test:e2e

# --- Build & codegen ---------------------------------------------------------

.PHONY: build
build: ## Build production images
	$(COMPOSE_PROD) build

.PHONY: client
client: ## Regenerate the frontend API clients from the backend OpenAPI schema
	bash frontend/scripts/generate-client.sh

# --- Database ----------------------------------------------------------------

.PHONY: migrate
migrate: ## Apply migrations
	$(COMPOSE) exec backend alembic upgrade head

.PHONY: migration
migration: ## Create a migration on the host (db must be up): make migration m="add foo"
	@test -n "$(m)" || (echo 'usage: make migration m="message"' && exit 1)
	cd backend && POSTGRES_SERVER=localhost uv run alembic revision --autogenerate -m "$(m)"

.PHONY: shell-db
shell-db: ## psql into the dev database
	$(COMPOSE) exec db sh -c 'psql -U "$$POSTGRES_USER" "$$POSTGRES_DB"'
