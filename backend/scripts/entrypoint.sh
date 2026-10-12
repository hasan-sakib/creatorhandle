#! /usr/bin/env bash

set -e

# Wait for the DB, run migrations, create initial data
bash scripts/prestart.sh

exec "$@"
