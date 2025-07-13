from abc import abstractmethod
from typing import Any, Dict, List, Optional

from .base_service import BaseService


class BaseRepoService(BaseService):
    """Abstract base class for code repository integration services (e.g., GitHub)."""

    @abstractmethod
    def push_code(
        self,
        file_path: str,
        code: str,
        commit_message: str,
        repo_config: Dict[str, Any],
    ) -> Any:
        """Push code to the repository with a specific commit message."""
        pass

    @abstractmethod
    def push_files(
        self,
        files: List[Dict[str, str]],
        commit_message: str,
        repo_config: Dict[str, Any],
        branch: str = "main",
    ) -> Any:
        """
        Push multiple files to a specific repo/branch with a single commit message.
        files: List[{'file_path': str, 'code': str}]
        """
        pass

    @abstractmethod
    def create_repository(self, repo_name: str, description: str = "") -> str:
        """Create a new repository."""
        pass

    @abstractmethod
    def list_repos(self) -> List[str]:
        """List all repositories."""
        pass

    def get_lastest_commit(self, repo_config: Dict[str, Any]) -> Optional[str]:
        """Get the latest commit of the repository."""
        pass
