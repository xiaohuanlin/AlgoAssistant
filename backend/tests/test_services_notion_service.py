from unittest.mock import MagicMock, patch

import pytest

from app.schemas.notion import NotionConfig
from app.services.notion_service import NotionService


class TestNotionService:
    """Test NotionService functionality."""

    def test_create_page_from_record_success(self):
        """Test successful page creation from record."""
        config = NotionConfig(token="test_token", db_id="test_db_id")
        service = NotionService(config)

        # Mock record object
        record = MagicMock()
        record.problem.title = "Two Sum"
        record.problem_id = 1
        record.oj_type = "leetcode"
        record.execution_result = "Accepted"
        record.language = "python"
        record.problem.difficulty = "Easy"
        record.topic_tags = ["Array", "Hash Table"]
        record.submit_time.isoformat.return_value = "2023-01-01T00:00:00"
        record.runtime = "100ms"
        record.memory = "50MB"
        record.total_correct = 10
        record.total_testcases = 10
        record.sync_status = "completed"
        record.problem.content = "Given an array of integers..."
        record.code = "def twoSum(nums, target): pass"
        record.submission_url = "https://leetcode.com/submissions/123"

        # Mock Notion API response
        mock_response = {"id": "test-page-id", "url": "https://notion.so/test-page"}

        with patch.object(service.client.pages, "create", return_value=mock_response):
            success, result = service.create_page_from_record(record)

            assert success is True
            assert result["page_id"] == "test-page-id"
            assert result["page_url"] == "https://notion.so/test-page"

    def test_create_page_from_record_failure(self):
        """Test page creation failure."""
        config = NotionConfig(token="test_token", db_id="test_db_id")
        service = NotionService(config)

        # Mock record object
        record = MagicMock()
        record.problem.title = "Two Sum"
        record.problem_id = 1
        record.oj_type = "leetcode"
        record.execution_result = "Accepted"
        record.language = "python"
        record.problem.difficulty = "Easy"
        record.topic_tags = []
        record.submit_time.isoformat.return_value = "2023-01-01T00:00:00"
        record.runtime = "100ms"
        record.memory = "50MB"
        record.total_correct = 10
        record.total_testcases = 10
        record.sync_status = "completed"
        record.problem.content = "Given an array of integers..."
        record.code = "def twoSum(nums, target): pass"
        record.submission_url = "https://leetcode.com/submissions/123"

        # Mock Notion API error
        from notion_client.errors import APIResponseError

        with patch.object(
            service.client.pages, "create", side_effect=APIResponseError("API Error")
        ):
            success, result = service.create_page_from_record(record)

            assert success is False
            assert "error" in result
