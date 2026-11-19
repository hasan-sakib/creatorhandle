from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.cli.initial_data import init_db
from app.core.config import settings
from app.core.db import engine
from app.main import app
from app.models import Item, User, Workspace, WorkspaceMember
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import get_superuser_token_headers

# The session teardown below deletes every user. Refuse to run against
# anything but a dedicated test database (scripts/tests-start.sh sets it up).
if not settings.POSTGRES_DB.endswith("_test"):
    pytest.exit(
        f"Refusing to run tests against POSTGRES_DB={settings.POSTGRES_DB!r}: "
        "use a *_test database (`make test` or scripts/tests-start.sh).",
        returncode=2,
    )


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        init_db(session)
        yield session
        statement = delete(Item)
        session.execute(statement)
        statement = delete(WorkspaceMember)
        session.execute(statement)
        statement = delete(Workspace)
        session.execute(statement)
        statement = delete(User)
        session.execute(statement)
        session.commit()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
