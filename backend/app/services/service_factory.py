from typing import Any, Dict

from app.models import UserConfig
from app.services.github_service import GitHubService
from app.services.leetcode_service import LeetCodeService
from app.services.notion_service import NotionService
from app.services.openai_service import OpenAIService


class ServiceFactory:
    """Factory for creating service instances with user-specific configuration."""

    def __init__(self, user_config: UserConfig):
        self.user_config = user_config

    @property
    def oj_service(self):
        """Get OJ service based on user configuration."""
        oj_type = self.user_config.oj_type
        if oj_type == "leetcode":
            return LeetCodeService(self.user_config.db_session)
        raise NotImplementedError(f"OJ service for {oj_type} is not implemented.")

    @property
    def ai_service(self):
        """Get AI service with user's OpenAI key."""
        return OpenAIService(self.user_config.openai_config)

    @property
    def notion_service(self):
        """Get Notion service with user's Notion token and database ID."""
        return NotionService(self.user_config.notion_config)

    @property
    def repo_service(self):
        """Get repository service (GitHub) with user's OAuth token."""
        repo_type = self.user_config.repo_type
        if repo_type == "github":
            return GitHubService(self.user_config.github_config)
        raise NotImplementedError(f"Repo service for {repo_type} is not implemented.")
