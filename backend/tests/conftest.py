import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.deps import get_db
from app.main import app
from app.models import Base

# 使用内存数据库，适合单元测试
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建所有表
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# 覆盖依赖
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "nickname": "Test User",
    }


@pytest.fixture
def test_record_data():
    """Sample record data for testing."""
    return {
        "oj_type": "leetcode",
        "problem_number": "1",
        "problem_title": "Two Sum",
        "status": "accepted",
        "language": "python",
        "code": "def twoSum(nums, target):\n    pass",
    }


@pytest.fixture
def test_tag_data():
    """Sample tag data for testing."""
    return {
        "name": "Two Pointers",
        "wiki": "A technique using two pointers to solve array problems",
    }
