from datetime import datetime
from unittest.mock import Mock, patch

import pytest

# Import models and services directly
from app.models import SyncStatus
from app.services.sync_task_service import SyncTaskService


class TestStandaloneSyncTaskService:
    """Standalone test cases for SyncTaskService without database dependencies."""

    def test_service_initialization(self):
        """Test that service can be initialized."""
        mock_db = Mock()
        service = SyncTaskService(mock_db)
        assert service is not None
        assert service.db == mock_db

    def test_get_sync_task_mock(self):
        """Test getting a sync task with mocked database."""
        mock_db = Mock()
        service = SyncTaskService(mock_db)

        # Mock the database query
        mock_task = Mock()
        mock_task.id = 1
        mock_task.task_type = "leetcode_batch"

        mock_db.query.return_value.filter.return_value.first.return_value = mock_task

        # Test getting a task
        result = service.get(1)

        assert result == mock_task
        mock_db.query.assert_called_once()

    def test_get_nonexistent_task_mock(self):
        """Test getting a non-existent task with mocked database."""
        mock_db = Mock()
        service = SyncTaskService(mock_db)

        # Mock the database query to return None
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Test getting a non-existent task
        result = service.get(999)

        assert result is None
        mock_db.query.assert_called_once()

    def test_update_task_status_mock(self):
        """Test updating task status with mocked database."""
        mock_db = Mock()
        service = SyncTaskService(mock_db)

        # Mock the task
        mock_task = Mock()
        mock_task.id = 1
        mock_task.status = SyncStatus.PENDING

        # Mock the database query
        mock_db.query.return_value.filter.return_value.first.return_value = mock_task
        mock_db.commit.return_value = None

        # Test updating status
        result = service.update_status(1, SyncStatus.RUNNING)

        assert result == mock_task
        assert mock_task.status == SyncStatus.RUNNING
        mock_db.commit.assert_called_once()

    def test_complete_task_mock(self):
        """Test completing a task with mocked database."""
        mock_db = Mock()
        service = SyncTaskService(mock_db)

        # Mock the task
        mock_task = Mock()
        mock_task.id = 1
        mock_task.status = SyncStatus.RUNNING

        # Mock the database query
        mock_db.query.return_value.filter.return_value.first.return_value = mock_task
        mock_db.commit.return_value = None

        # Test completing a task
        result_data = {"synced_count": 10, "failed_count": 2}
        result = service.complete(1, SyncStatus.COMPLETED, result_data)

        assert result == mock_task
        assert mock_task.status == SyncStatus.COMPLETED
        assert mock_task.result == result_data
        mock_db.commit.assert_called_once()

    def test_get_user_tasks_mock(self):
        """Test getting user tasks with mocked database."""
        mock_db = Mock()
        service = SyncTaskService(mock_db)

        # Mock the tasks
        mock_task1 = Mock()
        mock_task1.user_id = 1
        mock_task1.task_type = "leetcode_batch"

        mock_task2 = Mock()
        mock_task2.user_id = 1
        mock_task2.task_type = "github_sync"

        # Mock the database query
        mock_db.query.return_value.filter.return_value.filter.return_value.all.return_value = [
            mock_task1,
            mock_task2,
        ]

        # Test getting user tasks
        result = service.get_user_tasks(1)

        assert len(result) == 2
        assert result[0] == mock_task1
        assert result[1] == mock_task2

    def test_get_pending_tasks_mock(self):
        """Test getting pending tasks with mocked database."""
        mock_db = Mock()
        service = SyncTaskService(mock_db)

        # Mock the pending task
        mock_task = Mock()
        mock_task.status = SyncStatus.PENDING

        # Mock the database query
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_task]

        # Test getting pending tasks
        result = service.get_pending_tasks()

        assert len(result) == 1
        assert result[0] == mock_task


class TestStandaloneUserConfigService:
    """Standalone test cases for UserConfigService without database dependencies."""

    def test_service_initialization(self):
        """Test that service can be initialized."""
        mock_db = Mock()
        from app.services.user_config_service import UserConfigService

        service = UserConfigService(mock_db)
        assert service is not None
        assert service.db == mock_db

    def test_get_user_config_mock(self):
        """Test getting user config with mocked database."""
        mock_db = Mock()
        from app.services.user_config_service import UserConfigService

        service = UserConfigService(mock_db)

        # Mock the config
        mock_config = Mock()
        mock_config.leetcode_username = "testuser"
        mock_config.github_username = "githubuser"

        # Mock the database query
        mock_db.query.return_value.filter.return_value.first.return_value = mock_config

        # Test getting config
        result = service.get_user_config(1)

        assert result == mock_config
        mock_db.query.assert_called_once()

    def test_get_nonexistent_config_mock(self):
        """Test getting non-existent config with mocked database."""
        mock_db = Mock()
        from app.services.user_config_service import UserConfigService

        service = UserConfigService(mock_db)

        # Mock the database query to return None
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Test getting non-existent config
        result = service.get_user_config(999)

        assert result is None
        mock_db.query.assert_called_once()


class TestStandaloneSecurityUtils:
    """Standalone test cases for security utilities."""

    def test_password_hashing(self):
        """Test password hashing functionality."""
        from app.utils.security import get_password_hash, verify_password

        password = "testpassword123"
        hashed_password = get_password_hash(password)

        assert hashed_password != password
        assert len(hashed_password) > len(password)
        assert verify_password(password, hashed_password) is True
        assert verify_password("wrongpassword", hashed_password) is False

    def test_password_hashing_consistency(self):
        """Test that password hashing produces different hashes for same password."""
        from app.utils.security import get_password_hash, verify_password

        password = "testpassword"

        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes should be different due to salt
        assert hash1 != hash2
        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_create_access_token(self):
        """Test creating access token."""
        from app.utils.security import create_access_token, verify_token

        data = {"sub": "testuser"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

        # Decode token to verify content
        payload = verify_token(token)
        assert payload["sub"] == "testuser"

    def test_verify_token_valid(self):
        """Test verifying valid token."""
        from app.utils.security import create_access_token, verify_token

        data = {"sub": "testuser"}
        token = create_access_token(data)

        payload = verify_token(token)

        assert payload is not None
        assert payload["sub"] == "testuser"

    def test_verify_token_invalid(self):
        """Test verifying invalid token."""
        import jwt

        from app.utils.security import verify_token

        invalid_token = "invalid.token.here"

        with pytest.raises(jwt.InvalidTokenError):
            verify_token(invalid_token)
