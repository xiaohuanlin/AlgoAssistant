from app.services.leetcode_service import LeetCodeService
from app.services.openai_service import OpenAIService
from app.services.notion_service import NotionService
from app.services.github_service import GitHubService
from typing import Dict, Any
# Future: import other implementations as needed

class ServiceFactory:
    """Factory for creating service instances with user-specific configuration."""
    
    def __init__(self, user_config: Dict[str, Any]):
        self.user_config = user_config
    
    @property
    def oj_service(self):
        """Get OJ service based on user configuration."""
        oj_type = self.user_config.get("oj_type", "leetcode")
        if oj_type == "leetcode":
            return LeetCodeService()
        # TODO: Add more OJ implementations
        raise NotImplementedError(f"OJ service for {oj_type} is not implemented.")

    @property
    def ai_service(self):
        """Get AI service with user's OpenAI key."""
        openai_key = self.user_config.get("openai_key")
        if not openai_key:
            raise ValueError("OpenAI key not configured")
        return OpenAIService(openai_key)

    @property
    def notion_service(self):
        """Get Notion service with user's Notion token and database ID."""
        notion_token = self.user_config.get("notion_token")
        notion_db_id = self.user_config.get("notion_db_id")
        if not notion_token or not notion_db_id:
            raise ValueError("Notion token or database ID not configured")
        return NotionService(notion_token, notion_db_id)

    @property
    def repo_service(self):
        """Get repository service (GitHub) with user's OAuth token."""
        repo_type = self.user_config.get("repo_type", "github")
        if repo_type == "github":
            return GitHubService(self.user_config)
        # TODO: Add more Repo implementations
        raise NotImplementedError(f"Repo service for {repo_type} is not implemented.") 