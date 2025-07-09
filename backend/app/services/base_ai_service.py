from abc import ABC, abstractmethod
from typing import Any, Dict, List

class BaseAIService(ABC):
    """Abstract base class for AI analysis services."""

    @abstractmethod
    def analyze_code(self, code: str, problem_description: str = "", language: str = "") -> Dict[str, Any]:
        """Analyze code and return summary, tags, error analysis, etc."""
        pass

    @abstractmethod
    def recommend_related_problems(self, code: str, problem_id: str = "") -> List[str]:
        """Recommend related problems based on code and problem context."""
        pass 