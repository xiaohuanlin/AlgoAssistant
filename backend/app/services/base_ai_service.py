from abc import ABC, abstractmethod
from typing import Any, Dict, List, TypeVar

from .base_service import BaseService

ConfigType = TypeVar("ConfigType")


class BaseAIService(BaseService[ConfigType]):
    """Abstract base class for AI analysis services."""

    @abstractmethod
    def analyze_code(
        self, code: str, problem_description: str = "", language: str = ""
    ) -> Dict[str, Any]:
        """Analyze code and return summary, tags, error analysis, etc."""
        pass
