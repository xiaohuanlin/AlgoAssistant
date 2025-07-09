from abc import ABC, abstractmethod
from typing import Any, List, Dict

class BaseOJService(ABC):
    """Abstract base class for Online Judge (OJ) integration services."""

    @abstractmethod
    def fetch_user_submissions(self, username: str) -> List[Dict[str, Any]]:
        """Fetch user submissions from the OJ platform."""
        pass

    @abstractmethod
    def fetch_problem_detail(self, problem_id: str) -> Dict[str, Any]:
        """Fetch problem detail from the OJ platform."""
        pass 