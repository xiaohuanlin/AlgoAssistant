from datetime import datetime, timedelta
from unittest.mock import Mock, patch

import pytest

from app.models import SyncStatus, SyncTask
from app.services.sync_task_service import SyncTaskService


class TestSyncTaskService:
    """Test cases for SyncTaskService."""

    def test_create_sync_task(self, db_session):
        """Test creating a new sync task."""
        service = SyncTaskService(db_session)

        task_data = {
            "task_type": "leetcode_batch",
            "user_id": 1,
            "parameters": {"leetcode_username": "testuser"},
        }

        task = service.create(**task_data)

        assert task.id is not None
        assert task.task_type == "leetcode_batch"
        assert task.user_id == 1
        assert task.status == SyncStatus.PENDING
        assert task.parameters == {"leetcode_username": "testuser"}
        assert task.created_at is not None

    def test_get_sync_task(self, db_session):
        """Test retrieving a sync task by ID."""
        service = SyncTaskService(db_session)

        # Create a task first
        task = service.create(
            task_type="leetcode_batch",
            user_id=1,
            parameters={"leetcode_username": "testuser"},
        )

        # Retrieve the task
        retrieved_task = service.get(task.id)

        assert retrieved_task is not None
        assert retrieved_task.id == task.id
        assert retrieved_task.task_type == "leetcode_batch"

    def test_get_nonexistent_task(self, db_session):
        """Test retrieving a non-existent task returns None."""
        service = SyncTaskService(db_session)

        task = service.get(999)

        assert task is None

    def test_update_task_status(self, db_session):
        """Test updating task status."""
        service = SyncTaskService(db_session)

        task = service.create(
            task_type="leetcode_batch",
            user_id=1,
            parameters={"leetcode_username": "testuser"},
        )

        # Update status
        updated_task = service.update_status(task.id, SyncStatus.RUNNING)

        assert updated_task.status == SyncStatus.RUNNING
        assert updated_task.started_at is not None

    def test_complete_task(self, db_session):
        """Test completing a task."""
        service = SyncTaskService(db_session)

        task = service.create(
            task_type="leetcode_batch",
            user_id=1,
            parameters={"leetcode_username": "testuser"},
        )

        # Start the task
        service.update_status(task.id, SyncStatus.RUNNING)

        # Complete the task
        result = {"synced_count": 10, "failed_count": 2}
        completed_task = service.complete(task.id, SyncStatus.COMPLETED, result)

        assert completed_task.status == SyncStatus.COMPLETED
        assert completed_task.completed_at is not None
        assert completed_task.result == result

    def test_fail_task(self, db_session):
        """Test failing a task."""
        service = SyncTaskService(db_session)

        task = service.create(
            task_type="leetcode_batch",
            user_id=1,
            parameters={"leetcode_username": "testuser"},
        )

        # Start the task
        service.update_status(task.id, SyncStatus.RUNNING)

        # Fail the task
        error_message = "API rate limit exceeded"
        failed_task = service.complete(
            task.id, SyncStatus.FAILED, {"error": error_message}
        )

        assert failed_task.status == SyncStatus.FAILED
        assert failed_task.completed_at is not None
        assert failed_task.result == {"error": error_message}

    def test_get_user_tasks(self, db_session):
        """Test retrieving tasks for a specific user."""
        service = SyncTaskService(db_session)

        # Create tasks for different users
        service.create(task_type="leetcode_batch", user_id=1, parameters={})
        service.create(task_type="github_sync", user_id=1, parameters={})
        service.create(task_type="leetcode_batch", user_id=2, parameters={})

        # Get tasks for user 1
        user_tasks = service.get_user_tasks(1)

        assert len(user_tasks) == 2
        assert all(task.user_id == 1 for task in user_tasks)

    def test_get_pending_tasks(self, db_session):
        """Test retrieving pending tasks."""
        service = SyncTaskService(db_session)

        # Create tasks with different statuses
        pending_task = service.create(
            task_type="leetcode_batch", user_id=1, parameters={}
        )
        running_task = service.create(task_type="github_sync", user_id=1, parameters={})

        # Set one task to running
        service.update_status(running_task.id, SyncStatus.RUNNING)

        # Get pending tasks
        pending_tasks = service.get_pending_tasks()

        assert len(pending_tasks) == 1
        assert pending_tasks[0].id == pending_task.id
        assert pending_tasks[0].status == SyncStatus.PENDING

    def test_cleanup_old_tasks(self, db_session):
        """Test cleaning up old completed tasks."""
        service = SyncTaskService(db_session)

        # Create old completed task
        old_task = service.create(task_type="leetcode_batch", user_id=1, parameters={})
        old_task.created_at = datetime.utcnow() - timedelta(days=31)
        old_task.status = SyncStatus.COMPLETED
        old_task.completed_at = datetime.utcnow() - timedelta(days=30)
        db_session.commit()

        # Create recent task
        recent_task = service.create(task_type="github_sync", user_id=1, parameters={})
        recent_task.status = SyncStatus.COMPLETED
        recent_task.completed_at = datetime.utcnow() - timedelta(days=5)
        db_session.commit()

        # Cleanup old tasks
        deleted_count = service.cleanup_old_tasks(days=30)

        assert deleted_count == 1

        # Verify old task is deleted
        assert service.get(old_task.id) is None

        # Verify recent task still exists
        assert service.get(recent_task.id) is not None

    def test_get_task_statistics(self, db_session):
        """Test getting task statistics."""
        service = SyncTaskService(db_session)

        # Create tasks with different statuses
        service.create(task_type="leetcode_batch", user_id=1, parameters={})
        service.create(task_type="github_sync", user_id=1, parameters={})
        service.create(task_type="leetcode_batch", user_id=2, parameters={})

        # Set some tasks to different statuses
        tasks = service.get_user_tasks(1)
        service.update_status(tasks[0].id, SyncStatus.RUNNING)
        service.complete(tasks[1].id, SyncStatus.COMPLETED, {"synced_count": 5})

        # Get statistics
        stats = service.get_task_statistics(1)

        assert stats["total"] == 2
        assert stats["pending"] == 0
        assert stats["running"] == 1
        assert stats["completed"] == 1
        assert stats["failed"] == 0
