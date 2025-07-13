from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from app.models import Record, User, UserConfig


class TestNotionAPI:
    """Test cases for Notion API endpoints."""

    def test_test_notion_connection_success(self, client, db_session):
        """Test successful Notion connection test."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create user config with Notion settings
        config = UserConfig(
            user_id=user.id, notion_token="valid_token", notion_db_id="valid_db_id"
        )
        db_session.add(config)
        db_session.commit()

        # Mock successful Notion service connection test
        with patch("app.api.notion.get_current_user", return_value=user), patch(
            "app.services.notion_service.NotionService.test_connection",
            return_value=True,
        ):
            response = client.post("/api/notion/test-connection")

        assert response.status_code == 200
        data = response.json()
        assert data["connected"] is True
        assert "successfully connected" in data["message"].lower()

    def test_test_notion_connection_failure(self, client, db_session):
        """Test failed Notion connection test."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create user config with Notion settings
        config = UserConfig(
            user_id=user.id, notion_token="invalid_token", notion_db_id="invalid_db_id"
        )
        db_session.add(config)
        db_session.commit()

        # Mock failed Notion service connection test
        with patch("app.api.notion.get_current_user", return_value=user), patch(
            "app.services.notion_service.NotionService.test_connection",
            return_value=False,
        ):
            response = client.post("/api/notion/test-connection")

        assert response.status_code == 200
        data = response.json()
        assert data["connected"] is False
        assert "failed" in data["message"].lower()

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
            response = client.post("/api/notion/test-connection")

        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "notion" in data["error"].lower()

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

        # Mock successful sync
        with patch("app.api.notion.get_current_user", return_value=user), patch(
            "app.services.notion_service.NotionService.sync_records"
        ) as mock_sync:
            mock_sync.return_value = {
                "status": "success",
                "message": "Successfully synced 2 records",
                "total_records": 2,
                "synced_records": 2,
                "failed_records": 0,
            }

            response = client.post(
                "/api/notion/sync", json={"record_ids": [record1.id, record2.id]}
            )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["total_records"] == 2
        assert data["synced_records"] == 2
        assert data["failed_records"] == 0

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

        # Mock successful sync
        with patch("app.api.notion.get_current_user", return_value=user), patch(
            "app.services.notion_service.NotionService.sync_all_pending"
        ) as mock_sync:
            mock_sync.return_value = {
                "status": "success",
                "message": "Successfully synced 2 records",
                "total_records": 2,
                "synced_records": 2,
                "failed_records": 0,
            }

            response = client.post("/api/notion/sync", json={"sync_all_pending": True})

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["total_records"] == 2
        assert data["synced_records"] == 2
        assert data["failed_records"] == 0

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

        # Mock partial failure sync
        with patch("app.api.notion.get_current_user", return_value=user), patch(
            "app.services.notion_service.NotionService.sync_records"
        ) as mock_sync:
            mock_sync.return_value = {
                "status": "partial_success",
                "message": "Partially synced records",
                "total_records": 2,
                "synced_records": 1,
                "failed_records": 1,
            }

            response = client.post(
                "/api/notion/sync", json={"record_ids": [record1.id, record2.id]}
            )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "partial_success"
        assert data["total_records"] == 2
        assert data["synced_records"] == 1
        assert data["failed_records"] == 1

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
            response = client.post("/api/notion/sync", json={"record_ids": [1, 2]})

        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "notion" in data["error"].lower()

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
                "/api/notion/sync",
                json={
                    # No record_ids and sync_all_pending is False
                },
            )

        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_sync_to_notion_nonexistent_records(self, client, db_session):
        """Test syncing non-existent records to Notion."""
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
                "/api/notion/sync",
                json={"record_ids": [999, 1000]},  # Non-existent record IDs
            )

        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_unauthorized_access(self, client, db_session):
        """Test accessing Notion endpoints without authentication."""
        response = client.post("/api/notion/test-connection")
        assert response.status_code == 401

        response = client.post("/api/notion/sync", json={})
        assert response.status_code == 401

    def test_access_other_user_records(self, client, db_session):
        """Test syncing another user's records should fail."""
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

        # Create config for user1
        config = UserConfig(
            user_id=user1.id, notion_token="valid_token", notion_db_id="valid_db_id"
        )
        db_session.add(config)
        db_session.commit()

        # Create record for user2
        record = Record(
            user_id=user2.id,
            oj_type="leetcode",
            problem_number="1",
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass",
        )
        db_session.add(record)
        db_session.commit()

        # Try to sync user2's record with user1's account
        with patch("app.api.notion.get_current_user", return_value=user1):
            response = client.post("/api/notion/sync", json={"record_ids": [record.id]})

        assert response.status_code == 400
        data = response.json()
        assert "error" in data
