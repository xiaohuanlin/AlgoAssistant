from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from app.models import User, UserConfig
from app.services.user_config_service import UserConfigService


class TestUserConfigService:
    """Test cases for UserConfigService."""

    def test_get_user_config(self, db_session):
        """Test retrieving user configuration."""
        service = UserConfigService(db_session)

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create user config
        config = UserConfig(
            user_id=user.id,
            leetcode_username="leetcode_user",
            github_username="github_user",
            notion_token="notion_token_123",
        )
        db_session.add(config)
        db_session.commit()

        # Retrieve config
        retrieved_config = service.get_user_config(user.id)

        assert retrieved_config is not None
        assert retrieved_config.leetcode_username == "leetcode_user"
        assert retrieved_config.github_username == "github_user"
        assert retrieved_config.notion_token == "notion_token_123"

    def test_get_nonexistent_config(self, db_session):
        """Test retrieving non-existent config returns None."""
        service = UserConfigService(db_session)

        config = service.get_user_config(999)

        assert config is None

    def test_create_user_config(self, db_session):
        """Test creating new user configuration."""
        service = UserConfigService(db_session)

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create config
        config_data = {
            "leetcode_username": "leetcode_user",
            "github_username": "github_user",
            "notion_token": "notion_token_123",
            "notion_db_id": "notion_db_123",
        }

        config = service.create_or_update_config(user.id, config_data)

        assert config.id is not None
        assert config.user_id == user.id
        assert config.leetcode_username == "leetcode_user"
        assert config.github_username == "github_user"
        assert config.notion_token == "notion_token_123"
        assert config.notion_db_id == "notion_db_123"

    def test_update_existing_config(self, db_session):
        """Test updating existing user configuration."""
        service = UserConfigService(db_session)

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create initial config
        initial_config = UserConfig(
            user_id=user.id,
            leetcode_username="old_leetcode_user",
            github_username="old_github_user",
        )
        db_session.add(initial_config)
        db_session.commit()

        # Update config
        update_data = {
            "leetcode_username": "new_leetcode_user",
            "notion_token": "new_notion_token",
        }

        updated_config = service.create_or_update_config(user.id, update_data)

        assert updated_config.id == initial_config.id
        assert updated_config.leetcode_username == "new_leetcode_user"
        assert (
            updated_config.github_username == "old_github_user"
        )  # Should remain unchanged
        assert updated_config.notion_token == "new_notion_token"

    def test_update_partial_config(self, db_session):
        """Test updating only specific config fields."""
        service = UserConfigService(db_session)

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create initial config
        initial_config = UserConfig(
            user_id=user.id,
            leetcode_username="leetcode_user",
            github_username="github_user",
            notion_token="notion_token",
        )
        db_session.add(initial_config)
        db_session.commit()

        # Update only leetcode username
        update_data = {"leetcode_username": "updated_leetcode_user"}

        updated_config = service.create_or_update_config(user.id, update_data)

        assert updated_config.leetcode_username == "updated_leetcode_user"
        assert updated_config.github_username == "github_user"  # Unchanged
        assert updated_config.notion_token == "notion_token"  # Unchanged

    def test_delete_user_config(self, db_session):
        """Test deleting user configuration."""
        service = UserConfigService(db_session)

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create config
        config = UserConfig(user_id=user.id, leetcode_username="leetcode_user")
        db_session.add(config)
        db_session.commit()

        # Delete config
        service.delete_config(user.id)

        # Verify config is deleted
        retrieved_config = service.get_user_config(user.id)
        assert retrieved_config is None

    def test_get_leetcode_config(self, db_session):
        """Test getting LeetCode configuration for a user."""
        service = UserConfigService(db_session)

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create config with LeetCode settings
        config = UserConfig(
            user_id=user.id,
            leetcode_username="leetcode_user",
            leetcode_session_id="session_123",
        )
        db_session.add(config)
        db_session.commit()

        # Get LeetCode config
        leetcode_config = service.get_leetcode_config(user.id)

        assert leetcode_config is not None
        assert leetcode_config["username"] == "leetcode_user"
        assert leetcode_config["session_id"] == "session_123"

    def test_get_github_config(self, db_session):
        """Test getting GitHub configuration for a user."""
        service = UserConfigService(db_session)

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create config with GitHub settings
        config = UserConfig(
            user_id=user.id,
            github_username="github_user",
            github_token="github_token_123",
        )
        db_session.add(config)
        db_session.commit()

        # Get GitHub config
        github_config = service.get_github_config(user.id)

        assert github_config is not None
        assert github_config["username"] == "github_user"
        assert github_config["token"] == "github_token_123"

    def test_get_notion_config(self, db_session):
        """Test getting Notion configuration for a user."""
        service = UserConfigService(db_session)

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create config with Notion settings
        config = UserConfig(
            user_id=user.id,
            notion_token="notion_token_123",
            notion_db_id="notion_db_123",
        )
        db_session.add(config)
        db_session.commit()

        # Get Notion config
        notion_config = service.get_notion_config(user.id)

        assert notion_config is not None
        assert notion_config["token"] == "notion_token_123"
        assert notion_config["db_id"] == "notion_db_123"

    def test_validate_leetcode_config(self, db_session):
        """Test validating LeetCode configuration."""
        service = UserConfigService(db_session)

        # Test valid config
        valid_config = {"username": "leetcode_user", "session_id": "session_123"}

        is_valid = service.validate_leetcode_config(valid_config)
        assert is_valid is True

        # Test invalid config (missing username)
        invalid_config = {"session_id": "session_123"}

        is_valid = service.validate_leetcode_config(invalid_config)
        assert is_valid is False

    def test_validate_github_config(self, db_session):
        """Test validating GitHub configuration."""
        service = UserConfigService(db_session)

        # Test valid config
        valid_config = {"username": "github_user", "token": "github_token_123"}

        is_valid = service.validate_github_config(valid_config)
        assert is_valid is True

        # Test invalid config (missing token)
        invalid_config = {"username": "github_user"}

        is_valid = service.validate_github_config(invalid_config)
        assert is_valid is False

    def test_validate_notion_config(self, db_session):
        """Test validating Notion configuration."""
        service = UserConfigService(db_session)

        # Test valid config
        valid_config = {"token": "notion_token_123", "db_id": "notion_db_123"}

        is_valid = service.validate_notion_config(valid_config)
        assert is_valid is True

        # Test invalid config (missing token)
        invalid_config = {"db_id": "notion_db_123"}

        is_valid = service.validate_notion_config(invalid_config)
        assert is_valid is False
