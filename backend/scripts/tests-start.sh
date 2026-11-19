#! /usr/bin/env bash
set -e
set -x

# Tests run against their own database (<POSTGRES_DB>_test) so the conftest
# teardown, which deletes every user, never touches development data.
export POSTGRES_DB="${POSTGRES_TEST_DB:-${POSTGRES_DB:-app}_test}"

python -m app.cli.tests_pre_start
alembic upgrade head

bash scripts/test.sh "$@"
