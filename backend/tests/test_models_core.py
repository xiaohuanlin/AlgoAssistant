"""Tests for core database models."""

from datetime import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.database import Base
from app.schemas.github import GitHubConfig
from app.schemas.leetcode import LeetCodeConfig


class TestUserModel:
    """Test cases for User model."""

    def setup_method(self):
        """Set up test database."""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        self.session = Session()

    def teardown_method(self):
        """Clean up after each test."""
        self.session.close()

    def test_user_creation(self):
        """Test creating a user with required fields."""
        user = models.User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
            nickname="Test User",
        )

        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.password_hash == "hashed_password"
        assert user.nickname == "Test User"
        assert user.sync_allowed == "true"  # default value
        assert user.created_at is not None
        assert user.updated_at is not None

    def test_user_unique_constraints(self):
        """Test that username and email must be unique."""
        user1 = models.User(
            username="testuser", email="test@example.com", password_hash="hash1"
        )

        user2 = models.User(
            username="testuser",  # Same username
            email="different@example.com",
            password_hash="hash2",
        )

        self.session.add(user1)
        self.session.commit()

        self.session.add(user2)
        with pytest.raises(Exception):  # Should raise integrity error
            self.session.commit()

    def test_user_config_relationship(self):
        """Test relationship between User and UserConfig."""
        user = models.User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
        )

        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

        config = models.UserConfig(
            user_id=user.id,
            github_config=GitHubConfig(token="test_token", repo_name="test_repo"),
            leetcode_config=LeetCodeConfig(username="leetcode_user"),
        )

        self.session.add(config)
        self.session.commit()
        self.session.refresh(config)

        # Test relationship access
        assert user.configs.id == config.id
        assert config.user.id == user.id


class TestUserConfigModel:
    """Test cases for UserConfig model."""

    def setup_method(self):
        """Set up test database."""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        self.session = Session()

    def teardown_method(self):
        """Clean up after each test."""
        self.session.close()

    def test_user_config_creation(self):
        """Test creating user config with JSON fields."""
        # First create a user
        user = models.User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
        )
        self.session.add(user)
        self.session.commit()

        # Create config
        github_config = GitHubConfig(token="github_token", repo_name="my_repo")
        leetcode_config = LeetCodeConfig(username="leetcode_user")

        config = models.UserConfig(
            user_id=user.id,
            github_config=github_config,
            leetcode_config=leetcode_config,
        )

        self.session.add(config)
        self.session.commit()
        self.session.refresh(config)

        assert config.id is not None
        assert config.user_id == user.id
        assert config.github_config.token == "github_token"
        assert config.github_config.repo_name == "my_repo"
        assert config.leetcode_config.username == "leetcode_user"

    def test_user_config_optional_fields(self):
        """Test that config fields are optional."""
        user = models.User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
        )
        self.session.add(user)
        self.session.commit()

        config = models.UserConfig(user_id=user.id)
        self.session.add(config)
        self.session.commit()
        self.session.refresh(config)

        assert config.github_config is None
        assert config.leetcode_config is None
        assert config.notion_config is None
        assert config.gemini_config is None


class TestRecordModel:
    """Test cases for Record model."""

    def setup_method(self):
        """Set up test database."""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        self.session = Session()

    def teardown_method(self):
        """Clean up after each test."""
        self.session.close()

    def test_record_creation(self):
        """Test creating a record with required fields."""
        # Create user first
        user = models.User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
        )
        self.session.add(user)
        self.session.commit()

        # Create record
        record = models.Record(
            user_id=user.id,
            problem_id=123,
            problem_title="Two Sum",
            solution_code="def solution(): pass",
            execution_result="Accepted",
            language="python",
        )

        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)

        assert record.id is not None
        assert record.user_id == user.id
        assert record.problem_id == 123
        assert record.problem_title == "Two Sum"
        assert record.solution_code == "def solution(): pass"
        assert record.execution_result == "Accepted"
        assert record.language == "python"
        assert record.created_at is not None
        assert record.updated_at is not None

    def test_record_user_relationship(self):
        """Test relationship between Record and User."""
        user = models.User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
        )
        self.session.add(user)
        self.session.commit()

        record = models.Record(
            user_id=user.id,
            problem_id=123,
            problem_title="Test Problem",
            solution_code="test code",
            execution_result="Accepted",
            language="python",
        )

        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)

        # Test relationship access
        assert record.user.id == user.id
        assert record.user.username == "testuser"


class TestProblemModel:
    """Test cases for Problem model."""

    def setup_method(self):
        """Set up test database."""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        self.session = Session()

    def teardown_method(self):
        """Clean up after each test."""
        self.session.close()

    def test_problem_creation(self):
        """Test creating a problem with required fields."""
        problem = models.Problem(
            problem_id=1, title="Two Sum", difficulty="Easy", oj_type="leetcode"
        )

        self.session.add(problem)
        self.session.commit()
        self.session.refresh(problem)

        assert problem.id is not None
        assert problem.problem_id == 1
        assert problem.title == "Two Sum"
        assert problem.difficulty == "Easy"
        assert problem.oj_type == "leetcode"
        assert problem.created_at is not None
        assert problem.updated_at is not None

    def test_problem_unique_constraint(self):
        """Test that problem_id and oj_type combination must be unique."""
        problem1 = models.Problem(
            problem_id=1, title="Two Sum", difficulty="Easy", oj_type="leetcode"
        )

        problem2 = models.Problem(
            problem_id=1,  # Same problem_id
            title="Different Title",
            difficulty="Medium",
            oj_type="leetcode",  # Same oj_type
        )

        self.session.add(problem1)
        self.session.commit()

        self.session.add(problem2)
        with pytest.raises(Exception):  # Should raise integrity error
            self.session.commit()
