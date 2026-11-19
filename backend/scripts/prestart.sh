#! /usr/bin/env bash

set -e
set -x

# Let the DB start
python -m app.cli.pre_start

# Create the image bucket (no-op when image storage is not configured)
python -m app.cli.storage_init

# Run migrations
alembic upgrade head

# Create initial data in DB
python -m app.cli.initial_data
