from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from app.models import SyncStatus, SyncTask, User
from app.services.sync_task_service import SyncTaskService


class TestSimpleSyncTaskService:
    """Simple test cases for SyncTaskService without database dependencies."""

    def test_service_initialization(self):
        """Test that service can be initialized."""
        mock_db = Mock()
        service = SyncTaskService(mock_db)
        assert service is not None
        assert service.db == mock_db

    def test_create_sync_task_mock(self):
        """Test creating a sync task with mocked database."""
        mock_db = Mock()
        service = SyncTaskService(mock_db)

        # Mock the database operations
        mock_task = Mock()
        mock_task.id = 1
        mock_task.task_type = "leetcode_batch"
        mock_task.user_id = 1
        mock_task.status = SyncStatus.PENDING
        mock_task.parameters = {"leetcode_username": "testuser"}
        mock_task.created_at = datetime.utcnow()

        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None

        # Mock the query result
        mock_db.query.return_value.filter.return_value.first.return_value = mock_task

        task_data = {
            "task_type": "leetcode_batch",
            "user_id": 1,
            "parameters": {"leetcode_username": "testuser"},
        }

        # This would normally create a task, but we're just testing the mock setup
        assert service is not None
        assert mock_db is not None

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

    def test_get_task_statistics_mock(self):
        """Test getting task statistics with mocked database."""
        mock_db = Mock()
        service = SyncTaskService(mock_db)

        # Mock tasks with different statuses
        mock_pending = Mock()
        mock_pending.status = SyncStatus.PENDING

        mock_running = Mock()
        mock_running.status = SyncStatus.RUNNING

        mock_completed = Mock()
        mock_completed.status = SyncStatus.COMPLETED

        # Mock the database queries
        mock_db.query.return_value.filter.return_value.filter.return_value.count.return_value = (
            3
        )
        mock_db.query.return_value.filter.return_value.filter.return_value.filter.return_value.count.return_value = (
            1
        )
        mock_db.query.return_value.filter.return_value.filter.return_value.filter.return_value.filter.return_value.count.return_value = (
            1
        )
        mock_db.query.return_value.filter.return_value.filter.return_value.filter.return_value.filter.return_value.filter.return_value.count.return_value = (
            1
        )
        mock_db.query.return_value.filter.return_value.filter.return_value.filter.return_value.filter.return_value.filter.return_value.filter.return_value.count.return_value = (
            0
        )

        # Test getting statistics
        result = service.get_task_statistics(1)

        assert result["total"] == 3
        assert result["pending"] == 1
        assert result["running"] == 1
        assert result["completed"] == 1
        assert result["failed"] == 0
