from abc import abstractmethod
from typing import Any, Dict, Tuple, TypeVar

from app.models import Record

from .base_service import BaseService

ConfigType = TypeVar("ConfigType")


class BaseNoteService(BaseService[ConfigType]):
    """Abstract base class for note/knowledge base integration services (e.g., Notion)."""

    @abstractmethod
    def create_page_from_record(self, record: Record) -> Tuple[bool, Dict[str, str]]:
        """Create a page from a problem record."""
        pass
