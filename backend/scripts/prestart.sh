#! /usr/bin/env bash

set -e
set -x

# Let the DB start
python app/backend_pre_start.py

# Create the image bucket (no-op when image storage is not configured)
python app/storage_init.py

# Run migrations
alembic upgrade head

# Create initial data in DB
python app/initial_data.py
