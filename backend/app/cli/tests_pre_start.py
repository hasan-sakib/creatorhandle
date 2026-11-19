import logging

from sqlalchemy import Engine, create_engine, text
from sqlmodel import Session, select
from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

from app.core.config import settings
from app.core.db import engine
from app.core.log import configure_logging

logger = logging.getLogger(__name__)

max_tries = 60 * 5  # 5 minutes
wait_seconds = 1


@retry(
    stop=stop_after_attempt(max_tries),
    wait=wait_fixed(wait_seconds),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
def init(db_engine: Engine) -> None:
    try:
        # Try to create session to check if DB is awake
        with Session(db_engine) as session:
            session.exec(select(1))
    except Exception as e:
        logger.error(e)
        raise e


def ensure_test_database() -> None:
    """Create the test database (POSTGRES_DB, e.g. app_test) if it is missing.

    Tests must never share the dev database: the conftest teardown deletes
    every user, workspace and item.
    """
    name = settings.POSTGRES_DB
    if not name.endswith("_test"):
        raise SystemExit(f"Refusing to prepare non-test database {name!r}")
    admin_url = settings.SQLALCHEMY_DATABASE_URI.unicode_string().rsplit("/", 1)[0]
    admin = create_engine(f"{admin_url}/postgres", isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": name}
        ).scalar()
        if not exists:
            logger.info("Creating test database %s", name)
            conn.execute(text(f'CREATE DATABASE "{name}"'))
    admin.dispose()


def main() -> None:
    logger.info("Initializing service")
    ensure_test_database()
    init(engine)
    logger.info("Service finished initializing")


if __name__ == "__main__":
    configure_logging()
    main()
