from abc import ABC, abstractmethod
from typing import Any, Dict, Generator, List, Optional, TypeVar

from .base_service import BaseService

ConfigType = TypeVar("ConfigType")


class BaseOJService(BaseService[ConfigType]):
    """Abstract base class for Online Judge (OJ) integration services."""

    @abstractmethod
    def fetch_user_submissions(self) -> Generator[List[Dict[str, Any]], None, None]:
        """Fetch user submissions from the OJ platform."""
        pass

    @abstractmethod
    def fetch_user_submissions_detail(self, submission_id: int) -> Dict[str, Any]:
        """Fetch user submissions detail from the OJ platform."""
        pass

    @abstractmethod
    def fetch_problem_detail(self, title_slug: str) -> Optional[Dict[str, Any]]:
        """Fetch problem detail from the OJ platform."""
        pass
