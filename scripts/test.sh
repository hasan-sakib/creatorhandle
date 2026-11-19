#! /usr/bin/env sh

# Exit in case of error
set -e
set -x

# The tests run pytest inside the backend image, which needs the dev dependencies
export INSTALL_DEV=true

docker compose -f compose.yml build
docker compose -f compose.yml down --remove-orphans  # clear stacks left over from an earlier failed run (volumes are kept)
docker compose -f compose.yml up -d
docker compose -f compose.yml exec -T backend bash scripts/tests-start.sh "$@"
docker compose -f compose.yml down --remove-orphans
