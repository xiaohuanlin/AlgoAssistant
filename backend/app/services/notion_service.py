from typing import Any, Dict

from app.services.base_note_service import BaseNoteService


class NotionService(BaseNoteService):
    """Notion integration service implementation."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.token = config.get("token")
        self.db_id = config.get("db_id")

    def test_connection(self) -> bool:
        return bool(self.token and self.db_id)
