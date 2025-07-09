import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import Base
from app.deps import get_db
from app.config import settings
import os

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

@pytest.fixture(scope="session")
def db_engine():
    """Create database engine for testing."""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(db_engine):
    """Create database session for testing."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    try:
        transaction.rollback()
    except:
        pass  # Ignore if transaction is already closed
    connection.close()

@pytest.fixture
def client(db_session):
    """Create test client with overridden database dependency."""
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "nickname": "Test User"
    }

@pytest.fixture
def test_record_data():
    """Sample record data for testing."""
    return {
        "oj_type": "leetcode",
        "problem_id": "1",
        "problem_title": "Two Sum",
        "status": "accepted",
        "language": "python",
        "code": "def twoSum(nums, target):\n    pass"
    }

@pytest.fixture
def test_tag_data():
    """Sample tag data for testing."""
    return {
        "name": "Two Pointers",
        "wiki": "A technique using two pointers to solve array problems"
    } 