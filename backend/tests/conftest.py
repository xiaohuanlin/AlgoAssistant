"""
Test configuration and fixtures for the API tests.
"""

import os
import sys
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Set testing environment variable before importing app
os.environ["TESTING"] = "1"

# Add the backend app to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import Base  # noqa: E402
from app.deps import get_db  # noqa: E402
from app.main import app  # noqa: E402

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Test configuration
TEST_CONFIG = {
    "BASE_URL": "http://localhost:8000",
    "TEST_USER": {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "nickname": "Test User",
    },
}


def override_get_db():
    """Override the get_db dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine."""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(db_engine) -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client() -> TestClient:
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def base_url():
    """Base URL for API testing."""
    return TEST_CONFIG["BASE_URL"]


@pytest.fixture
def test_user():
    """Test user data."""
    return TEST_CONFIG["TEST_USER"]


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser123",
        "email": "test123@example.com",
        "password": "testpass123",
        "nickname": "Test User 123",
    }
