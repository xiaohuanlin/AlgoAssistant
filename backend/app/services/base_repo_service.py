from abc import abstractmethod
from typing import Any, Dict, List, Optional, TypeVar

from .base_service import BaseService

ConfigType = TypeVar("ConfigType")


class BaseRepoService(BaseService[ConfigType]):
    """Abstract base class for code repository integration services (e.g., GitHub)."""

    @abstractmethod
    def push_code(
        self,
        file_path: str,
        code: str,
        commit_message: str,
    ) -> Any:
        """Push code to the repository with a specific commit message."""
        pass

    @abstractmethod
    def push_files(
        self,
        files: List[Dict[str, str]],
        commit_message: str,
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

    def get_lastest_commit(self) -> Optional[str]:
        """Get the latest commit of the repository."""
        pass
