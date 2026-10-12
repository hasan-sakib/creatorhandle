#! /usr/bin/env bash

# Exit in case of error
set -e

# The tests run pytest inside the backend image, which needs the dev dependencies
export INSTALL_DEV=true

docker compose -f deploy/compose.yml down -v --remove-orphans # Remove possibly previous broken stacks left hanging after an error

if [ $(uname -s) = "Linux" ]; then
    echo "Remove __pycache__ files"
    sudo find . -type d -name __pycache__ -exec rm -r {} \+
fi

docker compose -f deploy/compose.yml build
docker compose -f deploy/compose.yml up -d
docker compose -f deploy/compose.yml exec -T backend bash scripts/tests-start.sh "$@"
