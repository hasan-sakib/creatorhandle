# Stage 0: install dependencies (shared bun workspace)
FROM oven/bun:1.4 AS deps

WORKDIR /app

# Build context: frontend/ (the Bun workspace root)
COPY package.json bun.lock /app/frontend/
COPY creator-workspace/package.json /app/frontend/creator-workspace/
COPY creator-site/package.json /app/frontend/creator-site/
COPY packages/shared/package.json /app/frontend/packages/shared/

WORKDIR /app/frontend
RUN bun install --frozen-lockfile


# Stage 1: build creator-workspace
FROM deps AS workspace-build

COPY packages /app/frontend/packages
COPY creator-workspace /app/frontend/creator-workspace
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID

WORKDIR /app/frontend/creator-workspace
RUN bun run build


# Stage 2: build creator-site
FROM deps AS site-build

COPY packages /app/frontend/packages
COPY creator-site /app/frontend/creator-site
ARG VITE_API_URL

WORKDIR /app/frontend/creator-site
RUN bun run build


# Stage 3: Caddy serves both apps and proxies /api to the backend
FROM caddy:2.11-alpine

COPY --from=workspace-build /app/frontend/creator-workspace/dist/ /srv/creator-workspace/
COPY --from=site-build /app/frontend/creator-site/dist/ /srv/creator-site/
# /@username pages get the creator's own meta tags (link previews, SEO)
COPY creator-site/scripts/profile-template.awk /tmp/profile-template.awk
RUN awk -f /tmp/profile-template.awk /srv/creator-site/index.html > /srv/creator-site/profile.html \
    && grep -q httpInclude /srv/creator-site/profile.html \
    && rm /tmp/profile-template.awk
COPY Caddyfile /etc/caddy/Caddyfile
