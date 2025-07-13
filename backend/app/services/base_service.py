from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseService(ABC):
    def __init__(self, config: Dict[str, Any]):
        self.config = config

    @abstractmethod
    def test_connection(self) -> bool:
        pass
