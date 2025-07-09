import pytest
from unittest.mock import patch, MagicMock
from app.services.notion_service import NotionService

class TestNotionService:
    """Test NotionService functionality."""
    
    def test_sync_record_success(self):
        """Test successful record sync to Notion."""
        service = NotionService("test_token", "test_db_id")
        
        record_data = {
            "id": 1,
            "problem_title": "Two Sum",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
            "tag_notion_urls": ["https://notion.so/tag1", "https://notion.so/tag2"]
        }
        
        result = service.sync_record(record_data)
        
        assert "notion.so" in result
        assert "fake-page-1" in result
        assert "https://notion.so/tag1|https://notion.so/tag2" in result
    
    def test_sync_record_without_tags(self):
        """Test record sync without tag relations."""
        service = NotionService("test_token", "test_db_id")
        
        record_data = {
            "id": 1,
            "problem_title": "Two Sum",
            "language": "python",
            "code": "def twoSum(nums, target): pass"
        }
        
        result = service.sync_record(record_data)
        
        assert "notion.so" in result
        assert "fake-page-1" in result
        assert "tags=" in result
    
    def test_update_tag_wiki_success(self):
        """Test successful tag wiki update."""
        service = NotionService("test_token", "test_db_id")
        
        result = service.update_tag_wiki("Two Pointers", "Updated wiki content")
        
        # Currently returns None as it's a mock implementation
        assert result is None
    
    def test_sync_tag_success(self):
        """Test successful tag sync to Notion."""
        service = NotionService("test_token", "test_db_id")
        
        tag_data = {
            "id": 1,
            "name": "Two Pointers",
            "wiki": "Two pointers technique"
        }
        
        result = service.sync_tag(tag_data)
        
        assert "notion.so" in result
        assert "fake-tag-1" in result
    
    def test_sync_tag_without_id(self):
        """Test tag sync without ID."""
        service = NotionService("test_token", "test_db_id")
        
        tag_data = {
            "name": "Two Pointers",
            "wiki": "Two pointers technique"
        }
        
        result = service.sync_tag(tag_data)
        
        assert "notion.so" in result
        assert "fake-tag-unknown" in result 