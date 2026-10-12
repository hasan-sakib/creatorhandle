#! /usr/bin/env bash

# Regenerates the typed API clients from the backend's OpenAPI schema:
#   frontend/creator-workspace/src/client  (the whole API)
#   frontend/creator-site/src/client       (public endpoints only)
# Run from the repo root. Needs uv and bun.

set -e

# The backend reads its settings from the environment; reuse deploy/.env locally.
# (tracing is off here so secrets are not echoed)
if [ -f deploy/.env ]; then
    set -a
    . deploy/.env
    set +a
fi

set -x

(cd backend && uv run python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))") > frontend/openapi.json
python3 deploy/scripts/openapi_public.py frontend/openapi.json frontend/openapi.public.json

(cd frontend/creator-workspace && bun run generate-client)
(cd frontend/creator-site && bun run generate-client)

rm -f frontend/openapi.json frontend/openapi.public.json
