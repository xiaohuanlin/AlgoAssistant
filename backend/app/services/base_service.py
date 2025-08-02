from abc import ABC, abstractmethod
from typing import Any, Dict, Generic, TypeVar

ConfigType = TypeVar("ConfigType")


class BaseService(ABC, Generic[ConfigType]):
    def __init__(self, config: ConfigType):
        self.config = config

    @abstractmethod
    def test_connection(self) -> bool:
        pass
