from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from app.models import SyncStatus, SyncTask, User


class TestSyncTaskAPI:
    """Test cases for sync task API endpoints."""

    def test_create_sync_task(self, client, db_session):
        """Test creating a new sync task via API."""
        # Create a test user
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Mock authentication
        with patch("app.api.sync_task.get_current_user", return_value=user):
            response = client.post(
                "/api/sync-tasks/",
                json={
                    "task_type": "leetcode_batch",
                    "parameters": {"leetcode_username": "testuser"},
                },
            )

        assert response.status_code == 201
        data = response.json()
        assert data["task_type"] == "leetcode_batch"
        assert data["user_id"] == user.id
        assert data["status"] == "pending"
        assert "id" in data

    def test_create_sync_task_invalid_type(self, client, db_session):
        """Test creating sync task with invalid task type."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        with patch("app.api.sync_task.get_current_user", return_value=user):
            response = client.post(
                "/api/sync-tasks/", json={"task_type": "invalid_type", "parameters": {}}
            )

        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_get_sync_task(self, client, db_session):
        """Test retrieving a sync task via API."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create a sync task
        task = SyncTask(
            task_type="leetcode_batch",
            user_id=user.id,
            parameters={"leetcode_username": "testuser"},
            status=SyncStatus.PENDING,
        )
        db_session.add(task)
        db_session.commit()

        with patch("app.api.sync_task.get_current_user", return_value=user):
            response = client.get(f"/api/sync-tasks/{task.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task.id
        assert data["task_type"] == "leetcode_batch"
        assert data["status"] == "pending"

    def test_get_nonexistent_sync_task(self, client, db_session):
        """Test retrieving a non-existent sync task."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        with patch("app.api.sync_task.get_current_user", return_value=user):
            response = client.get("/api/sync-tasks/999")

        assert response.status_code == 404

    def test_get_user_sync_tasks(self, client, db_session):
        """Test retrieving all sync tasks for a user."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create multiple sync tasks
        task1 = SyncTask(
            task_type="leetcode_batch",
            user_id=user.id,
            parameters={"leetcode_username": "testuser"},
            status=SyncStatus.PENDING,
        )
        task2 = SyncTask(
            task_type="github_sync",
            user_id=user.id,
            parameters={"github_username": "testuser"},
            status=SyncStatus.COMPLETED,
        )
        db_session.add_all([task1, task2])
        db_session.commit()

        with patch("app.api.sync_task.get_current_user", return_value=user):
            response = client.get("/api/sync-tasks/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert any(task["task_type"] == "leetcode_batch" for task in data)
        assert any(task["task_type"] == "github_sync" for task in data)

    def test_cancel_sync_task(self, client, db_session):
        """Test canceling a sync task."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create a pending sync task
        task = SyncTask(
            task_type="leetcode_batch",
            user_id=user.id,
            parameters={"leetcode_username": "testuser"},
            status=SyncStatus.PENDING,
        )
        db_session.add(task)
        db_session.commit()

        with patch("app.api.sync_task.get_current_user", return_value=user):
            response = client.post(f"/api/sync-tasks/{task.id}/cancel")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"

        # Verify task is cancelled in database
        db_session.refresh(task)
        assert task.status == SyncStatus.CANCELLED

    def test_cancel_completed_task(self, client, db_session):
        """Test canceling a completed task should fail."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create a completed sync task
        task = SyncTask(
            task_type="leetcode_batch",
            user_id=user.id,
            parameters={"leetcode_username": "testuser"},
            status=SyncStatus.COMPLETED,
            completed_at=datetime.utcnow(),
        )
        db_session.add(task)
        db_session.commit()

        with patch("app.api.sync_task.get_current_user", return_value=user):
            response = client.post(f"/api/sync-tasks/{task.id}/cancel")

        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_get_task_statistics(self, client, db_session):
        """Test getting task statistics for a user."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create tasks with different statuses
        pending_task = SyncTask(
            task_type="leetcode_batch",
            user_id=user.id,
            parameters={},
            status=SyncStatus.PENDING,
        )
        running_task = SyncTask(
            task_type="github_sync",
            user_id=user.id,
            parameters={},
            status=SyncStatus.RUNNING,
        )
        completed_task = SyncTask(
            task_type="notion_sync",
            user_id=user.id,
            parameters={},
            status=SyncStatus.COMPLETED,
            completed_at=datetime.utcnow(),
        )
        db_session.add_all([pending_task, running_task, completed_task])
        db_session.commit()

        with patch("app.api.sync_task.get_current_user", return_value=user):
            response = client.get("/api/sync-tasks/statistics")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert data["pending"] == 1
        assert data["running"] == 1
        assert data["completed"] == 1
        assert data["failed"] == 0

    def test_unauthorized_access(self, client, db_session):
        """Test accessing sync task endpoints without authentication."""
        response = client.get("/api/sync-tasks/")
        assert response.status_code == 401

    def test_access_other_user_task(self, client, db_session):
        """Test accessing another user's sync task should fail."""
        # Create two users
        user1 = User(
            username="user1",
            email="user1@example.com",
            hashed_password="hashed_password",
        )
        user2 = User(
            username="user2",
            email="user2@example.com",
            hashed_password="hashed_password",
        )
        db_session.add_all([user1, user2])
        db_session.commit()

        # Create a task for user2
        task = SyncTask(
            task_type="leetcode_batch",
            user_id=user2.id,
            parameters={"leetcode_username": "user2"},
            status=SyncStatus.PENDING,
        )
        db_session.add(task)
        db_session.commit()

        # Try to access with user1
        with patch("app.api.sync_task.get_current_user", return_value=user1):
            response = client.get(f"/api/sync-tasks/{task.id}")

        assert response.status_code == 404

    def test_create_task_with_missing_parameters(self, client, db_session):
        """Test creating sync task with missing required parameters."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        with patch("app.api.sync_task.get_current_user", return_value=user):
            response = client.post(
                "/api/sync-tasks/",
                json={
                    "task_type": "leetcode_batch"
                    # Missing parameters
                },
            )

        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_create_task_with_invalid_parameters(self, client, db_session):
        """Test creating sync task with invalid parameters."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        with patch("app.api.sync_task.get_current_user", return_value=user):
            response = client.post(
                "/api/sync-tasks/",
                json={
                    "task_type": "leetcode_batch",
                    "parameters": {"leetcode_username": ""},  # Empty username
                },
            )

        assert response.status_code == 400
        data = response.json()
        assert "error" in data
