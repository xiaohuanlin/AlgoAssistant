from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseRepoService(ABC):
    """Abstract base class for code repository integration services (e.g., GitHub)."""

    @abstractmethod
    def push_code(self, file_path: str, code: str, commit_message: str, repo_config: Dict[str, Any]) -> Any:
        """Push code to the repository with a specific commit message."""
        pass 