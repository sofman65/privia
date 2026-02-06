import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, engine


@pytest.fixture(scope="module")
def client():
    # Ensure tables exist for tests regardless of cwd or startup events
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
