#! /usr/bin/env bash

# Exit in case of error
set -e

# The tests run pytest inside the backend image, which needs the dev dependencies
export INSTALL_DEV=true

docker compose -f compose.yml down --remove-orphans  # clear stacks left over from an earlier failed run (volumes are kept)

if [ $(uname -s) = "Linux" ]; then
    echo "Remove __pycache__ files"
    sudo find . -type d -name __pycache__ -exec rm -r {} \+
fi

docker compose -f compose.yml build
docker compose -f compose.yml up -d
docker compose -f compose.yml exec -T backend bash scripts/tests-start.sh "$@"
