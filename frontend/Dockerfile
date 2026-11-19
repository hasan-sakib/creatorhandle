# Stage 0: install dependencies (shared bun workspace)
FROM oven/bun:1.4 AS deps

WORKDIR /app

COPY package.json bun.lock /app/
COPY frontend/creator-workspace/package.json /app/frontend/creator-workspace/
COPY frontend/creator-site/package.json /app/frontend/creator-site/
COPY frontend/packages/shared/package.json /app/frontend/packages/shared/

RUN bun install --frozen-lockfile


# Stage 1: build creator-workspace
FROM deps AS workspace-build

COPY ./frontend/packages /app/frontend/packages
COPY ./frontend/creator-workspace /app/frontend/creator-workspace
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID

WORKDIR /app/frontend/creator-workspace
RUN bun run build


# Stage 2: build creator-site
FROM deps AS site-build

COPY ./frontend/packages /app/frontend/packages
COPY ./frontend/creator-site /app/frontend/creator-site
ARG VITE_API_URL

WORKDIR /app/frontend/creator-site
RUN bun run build


# Stage 3: Caddy serves both apps and proxies /api to the backend
FROM caddy:2.11-alpine

COPY --from=workspace-build /app/frontend/creator-workspace/dist/ /srv/creator-workspace/
COPY --from=site-build /app/frontend/creator-site/dist/ /srv/creator-site/
COPY ./frontend/Caddyfile /etc/caddy/Caddyfile
