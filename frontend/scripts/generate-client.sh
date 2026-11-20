#! /usr/bin/env bash

# Regenerates the typed API clients from the backend's OpenAPI schema:
#   frontend/creator-workspace/src/client  (the whole API)
#   frontend/creator-site/src/client       (public endpoints only)
# Callable from anywhere (`make client`, `bun run generate-client`).
# Needs uv and bun; the backend does not have to be running.

set -e

cd "$(dirname "$0")/../.."   # repo root

set -x

(cd backend && uv run python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))") > frontend/openapi.json
python3 frontend/scripts/openapi_public.py frontend/openapi.json frontend/openapi.public.json

(cd frontend/creator-workspace && bun run generate-client)
(cd frontend/creator-site && bun run generate-client)

rm -f frontend/openapi.json frontend/openapi.public.json
