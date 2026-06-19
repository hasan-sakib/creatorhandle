#! /usr/bin/env sh

# Exit in case of error
set -e
set -x

docker compose -f deploy/compose.yml build
docker compose -f deploy/compose.yml down -v --remove-orphans # Remove possibly previous broken stacks left hanging after an error
docker compose -f deploy/compose.yml up -d
docker compose -f deploy/compose.yml exec -T backend bash scripts/tests-start.sh "$@"
docker compose -f deploy/compose.yml down -v --remove-orphans
