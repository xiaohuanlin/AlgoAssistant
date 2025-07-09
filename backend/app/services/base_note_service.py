from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseNoteService(ABC):
    """Abstract base class for note/knowledge base integration services (e.g., Notion)."""

    @abstractmethod
    def sync_record(self, record: Dict[str, Any]) -> Any:
        """Sync a problem record to the note/knowledge base platform."""
        pass

    @abstractmethod
    def update_tag_wiki(self, tag: str, wiki_content: str) -> Any:
        """Update or create wiki information for a specific tag."""
        pass 