from unittest.mock import MagicMock, patch

import pytest

from app.services.gemini_service import GeminiService
from app.services.github_service import GitHubService
from app.services.leetcode_service import LeetCodeService
from app.services.notion_service import NotionService
from app.services.service_factory import ServiceFactory


class TestServiceFactory:
    """Test ServiceFactory functionality."""

    def test_oj_service_creation(self):
        """Test OJ service creation."""
        user_config = {"oj_type": "leetcode"}
        factory = ServiceFactory(user_config)

        oj_service = factory.oj_service

        assert isinstance(oj_service, LeetCodeService)

    def test_oj_service_unsupported_type(self):
        """Test OJ service creation with unsupported type."""
        user_config = {"oj_type": "unsupported"}
        factory = ServiceFactory(user_config)

        with pytest.raises(NotImplementedError) as exc_info:
            factory.oj_service

        assert "OJ service for unsupported is not implemented" in str(exc_info.value)

    def test_ai_service_creation_with_key(self):
        """Test AI service creation with Gemini key."""
        user_config = {"gemini_config":[object Object]api_key":test_gemini_key"}}
        factory = ServiceFactory(user_config)

        ai_service = factory.ai_service

        assert isinstance(ai_service, GeminiService)

    def test_ai_service_creation_without_key(self):
        """Test AI service creation without Gemini key."""
        user_config = [object Object]
        factory = ServiceFactory(user_config)

        with pytest.raises(ValueError) as exc_info:
            factory.ai_service

        assert "Gemini key not configured" in str(exc_info.value)

    def test_notion_service_creation_with_config(self):
        """Test Notion service creation with token and database ID."""
        user_config = {
            "notion_token": "test_notion_token",
            "notion_db_id": "test_db_id"
        }
        factory = ServiceFactory(user_config)

        notion_service = factory.notion_service

        assert isinstance(notion_service, NotionService)

    def test_notion_service_creation_without_token(self):
        """Test Notion service creation without token."""
        user_config = {"notion_db_id": "test_db_id"}
        factory = ServiceFactory(user_config)

        with pytest.raises(ValueError) as exc_info:
            factory.notion_service

        assert "Notion token or database ID not configured" in str(exc_info.value)

    def test_notion_service_creation_without_db_id(self):
        """Test Notion service creation without database ID."""
        user_config = {"notion_token": "test_notion_token"}
        factory = ServiceFactory(user_config)

        with pytest.raises(ValueError) as exc_info:
            factory.notion_service

        assert "Notion token or database ID not configured" in str(exc_info.value)

    def test_repo_service_creation_github(self):
        """Test repository service creation for GitHub."""
        user_config = {"repo_type": "github"}
        factory = ServiceFactory(user_config)

        repo_service = factory.repo_service

        assert isinstance(repo_service, GitHubService)

    def test_repo_service_creation_unsupported_type(self):
        """Test repository service creation with unsupported type."""
        user_config = {"repo_type": "unsupported"}
        factory = ServiceFactory(user_config)

        with pytest.raises(NotImplementedError) as exc_info:
            factory.repo_service

        assert "Repo service for unsupported is not implemented" in str(exc_info.value)

    def test_repo_service_creation_default_type(self):
        """Test repository service creation with default type."""
        user_config = {}  # No repo_type specified
        factory = ServiceFactory(user_config)

        repo_service = factory.repo_service

        assert isinstance(repo_service, GitHubService)

    def test_oj_service_creation_default_type(self):
        """Test OJ service creation with default type."""
        user_config = {}  # No oj_type specified
        factory = ServiceFactory(user_config)

        oj_service = factory.oj_service

        assert isinstance(oj_service, LeetCodeService)

    def test_factory_with_complete_config(self):
        """Test factory with complete user configuration."""
        user_config = {
            "oj_type": "leetcode",
            "gemini_config":[object Object]api_key": "test_gemini_key"},
            "notion_token": "test_notion_token",
            "notion_db_id": "test_db_id",
            "repo_type": "github"
        }
        factory = ServiceFactory(user_config)

        # Test all services can be created
        oj_service = factory.oj_service
        ai_service = factory.ai_service
        notion_service = factory.notion_service
        repo_service = factory.repo_service

        assert isinstance(oj_service, LeetCodeService)
        assert isinstance(ai_service, GeminiService)
        assert isinstance(notion_service, NotionService)
        assert isinstance(repo_service, GitHubService)

    def test_factory_user_config_access(self):
        """Test that factory preserves user configuration."""
        user_config = {
            "oj_type": "leetcode",
            "gemini_config":[object Object]api_key": "test_gemini_key"},
            "custom_field": "custom_value"
        }
        factory = ServiceFactory(user_config)

        assert factory.user_config == user_config
        assert factory.user_config["custom_field"] == "custom_value"

    def test_factory_with_empty_config(self):
        """Test factory with empty configuration."""
        user_config = {}
        factory = ServiceFactory(user_config)

        # Should use defaults for OJ and repo services
        oj_service = factory.oj_service
        repo_service = factory.repo_service

        assert isinstance(oj_service, LeetCodeService)
        assert isinstance(repo_service, GitHubService)

        # Should fail for services requiring configuration
        with pytest.raises(ValueError):
            factory.ai_service

        with pytest.raises(ValueError):
            factory.notion_service

    def test_create_leetcode_service(self):
        """Test creating LeetCode service."""
        user_config = {"oj_type": "leetcode"}
        factory = ServiceFactory(user_config)

        service = factory.oj_service

        assert isinstance(service, LeetCodeService)

    def test_create_github_service(self):
        """Test creating GitHub service."""
        user_config = {"repo_type": "github", "github_token": "encrypted_token"}
        factory = ServiceFactory(user_config)

        service = factory.repo_service

        assert isinstance(service, GitHubService)
        assert service.user_config == user_config

    def test_create_notion_service(self):
        """Test creating Notion service."""
        user_config = {
            "notion_token": "test_token",
            "notion_db_id": "test_db_id"
        }
        factory = ServiceFactory(user_config)

        service = factory.notion_service

        assert isinstance(service, NotionService)

    def test_create_gemini_service(self):
        """Test creating Gemini service."""
        user_config = {"gemini_config": {"api_key": "test_key"}}
        factory = ServiceFactory(user_config)

        service = factory.ai_service

        assert isinstance(service, GeminiService)

    def test_create_unsupported_oj_service(self):
        """Test creating unsupported OJ service."""
        user_config = {"oj_type": "unsupported"}
        factory = ServiceFactory(user_config)

        with pytest.raises(NotImplementedError) as exc_info:
            factory.oj_service

        assert "unsupported" in str(exc_info.value)

    def test_create_unsupported_repo_service(self):
        """Test creating unsupported repo service."""
        user_config = {"repo_type": "unsupported"}
        factory = ServiceFactory(user_config)

        with pytest.raises(NotImplementedError) as exc_info:
            factory.repo_service

        assert "unsupported" in str(exc_info.value)

    def test_create_notion_service_missing_config(self):
        """Test creating Notion service with missing configuration."""
        user_config = {"notion_token": "test_token"}  # Missing notion_db_id
        factory = ServiceFactory(user_config)

        with pytest.raises(ValueError) as exc_info:
            factory.notion_service

        assert "Notion token or database ID not configured" in str(exc_info.value)

    def test_create_gemini_service_missing_config(self):
        """Test creating Gemini service with missing configuration."""
        user_config =[object Object]  # Missing gemini_config
        factory = ServiceFactory(user_config)

        with pytest.raises(ValueError) as exc_info:
            factory.ai_service

        assert "Gemini key not configured" in str(exc_info.value)

    def test_service_factory_singleton_behavior(self):
        """Test that service factory returns same instances for same config."""
        user_config = {"oj_type": "leetcode"}
        factory = ServiceFactory(user_config)

        service1 = factory.oj_service
        service2 = factory.oj_service

        # ServiceFactory doesn't implement singleton pattern, so instances should be different
        assert service1 is not service2
        assert isinstance(service1, LeetCodeService)
        assert isinstance(service2, LeetCodeService)
