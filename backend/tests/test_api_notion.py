from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import Record, User, UserConfig

client = TestClient(app)


class TestNotionAPI:
    """Test Notion API endpoints."""

    def test_test_notion_connection_success(self, client, db_session):
        """Test successful Notion connection test."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create user config
        config = UserConfig(
            user_id=user.id, notion_token="valid_token", notion_db_id="valid_db_id"
        )
        db_session.add(config)
        db_session.commit()

        # Mock successful connection test
        with patch("app.api.notion.get_current_user", return_value=user), patch(
            "app.services.notion_service.NotionService.test_connection"
        ) as mock_test:
            mock_test.return_value = True

            response = client.get("/api/notion/test_connection")

        assert response.status_code == 200
        data = response.json()
        assert data["connected"] is True
        assert "successfully" in data["message"]

    def test_test_notion_connection_failure(self, client, db_session):
        """Test failed Notion connection test."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create user config
        config = UserConfig(
            user_id=user.id, notion_token="valid_token", notion_db_id="valid_db_id"
        )
        db_session.add(config)
        db_session.commit()

        # Mock failed connection test
        with patch("app.api.notion.get_current_user", return_value=user), patch(
            "app.services.notion_service.NotionService.test_connection"
        ) as mock_test:
            mock_test.return_value = False

            response = client.get("/api/notion/test_connection")

        assert response.status_code == 200
        data = response.json()
        assert data["connected"] is False
        assert "Failed to connect" in data["message"]

    def test_test_notion_connection_no_config(self, client, db_session):
        """Test Notion connection test when user has no config."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        with patch("app.api.notion.get_current_user", return_value=user):
            response = client.get("/api/notion/test_connection")

        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "not configured" in data["error"].lower()

    def test_sync_to_notion_specific_records(self, client, db_session):
        """Test syncing specific records to Notion."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create user config
        config = UserConfig(
            user_id=user.id, notion_token="valid_token", notion_db_id="valid_db_id"
        )
        db_session.add(config)
        db_session.commit()

        # Create test records
        record1 = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_number="1",
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass",
        )
        record2 = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_number="2",
            problem_title="Add Two Numbers",
            status="accepted",
            language="python",
            code="def addTwoNumbers(l1, l2): pass",
        )
        db_session.add_all([record1, record2])
        db_session.commit()

        # Mock successful sync task creation
        with patch("app.api.notion.get_current_user", return_value=user), patch(
            "app.services.sync_task_service.SyncTaskService.create"
        ) as mock_create, patch(
            "app.tasks.task_manager.TaskManager.start_sync_task"
        ) as mock_start:
            mock_create.return_value = MagicMock(id=1, status="pending")
            mock_start.return_value = True

            response = client.post(
                "/api/sync_task/",
                json={"type": "notion_sync", "record_ids": [record1.id, record2.id]},
            )

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "notion_sync"
        assert data["status"] == "pending"

    def test_sync_to_notion_all_pending(self, client, db_session):
        """Test syncing all pending records to Notion."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create user config
        config = UserConfig(
            user_id=user.id, notion_token="valid_token", notion_db_id="valid_db_id"
        )
        db_session.add(config)
        db_session.commit()

        # Create test records
        record1 = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_number="1",
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass",
        )
        record2 = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_number="2",
            problem_title="Add Two Numbers",
            status="accepted",
            language="python",
            code="def addTwoNumbers(l1, l2): pass",
        )
        db_session.add_all([record1, record2])
        db_session.commit()

        # Mock successful sync task creation
        with patch("app.api.notion.get_current_user", return_value=user), patch(
            "app.services.sync_task_service.SyncTaskService.create"
        ) as mock_create, patch(
            "app.tasks.task_manager.TaskManager.start_sync_task"
        ) as mock_start:
            mock_create.return_value = MagicMock(id=1, status="pending")
            mock_start.return_value = True

            response = client.post(
                "/api/sync_task/",
                json={"type": "notion_sync", "record_ids": [record1.id, record2.id]},
            )

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "notion_sync"
        assert data["status"] == "pending"

    def test_sync_to_notion_partial_failure(self, client, db_session):
        """Test syncing to Notion with partial failures."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create user config
        config = UserConfig(
            user_id=user.id, notion_token="valid_token", notion_db_id="valid_db_id"
        )
        db_session.add(config)
        db_session.commit()

        # Create test records
        record1 = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_number="1",
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass",
        )
        record2 = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_number="2",
            problem_title="Add Two Numbers",
            status="accepted",
            language="python",
            code="def addTwoNumbers(l1, l2): pass",
        )
        db_session.add_all([record1, record2])
        db_session.commit()

        # Mock sync task creation with failure
        with patch("app.api.notion.get_current_user", return_value=user), patch(
            "app.services.sync_task_service.SyncTaskService.create"
        ) as mock_create, patch(
            "app.tasks.task_manager.TaskManager.start_sync_task"
        ) as mock_start:
            mock_create.return_value = MagicMock(id=1, status="pending")
            mock_start.return_value = False

            response = client.post(
                "/api/sync_task/",
                json={"type": "notion_sync", "record_ids": [record1.id, record2.id]},
            )

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "notion_sync"

    def test_sync_to_notion_no_config(self, client, db_session):
        """Test syncing to Notion when user has no config."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        with patch("app.api.notion.get_current_user", return_value=user):
            response = client.post(
                "/api/sync_task/", json={"type": "notion_sync", "record_ids": [1, 2]}
            )

        assert response.status_code == 201  # Task creation should still succeed

    def test_sync_to_notion_invalid_request(self, client, db_session):
        """Test syncing to Notion with invalid request."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create user config
        config = UserConfig(
            user_id=user.id, notion_token="valid_token", notion_db_id="valid_db_id"
        )
        db_session.add(config)
        db_session.commit()

        with patch("app.api.notion.get_current_user", return_value=user):
            response = client.post(
                "/api/sync_task/",
                json={
                    # No record_ids and sync_all_pending is False
                },
            )

        assert response.status_code == 422  # Validation error

    def test_sync_to_notion_nonexistent_records(self, client, db_session):
        """Test syncing to Notion with nonexistent records."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create user config
        config = UserConfig(
            user_id=user.id, notion_token="valid_token", notion_db_id="valid_db_id"
        )
        db_session.add(config)
        db_session.commit()

        with patch("app.api.notion.get_current_user", return_value=user), patch(
            "app.services.sync_task_service.SyncTaskService.create"
        ) as mock_create, patch(
            "app.tasks.task_manager.TaskManager.start_sync_task"
        ) as mock_start:
            mock_create.return_value = MagicMock(id=1, status="pending")
            mock_start.return_value = True

            response = client.post(
                "/api/sync_task/",
                json={
                    "type": "notion_sync",
                    "record_ids": [999, 1000],  # Nonexistent record IDs
                },
            )

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "notion_sync"

    def test_unauthorized_access(self, client, db_session):
        """Test unauthorized access to Notion endpoints."""
        response = client.get("/api/notion/test_connection")
        assert response.status_code == 401

    def test_access_other_user_records(self, client, db_session):
        """Test accessing other user's records."""
        # This test would be relevant if we had user-specific record access
        # For now, it's a placeholder
        pass
