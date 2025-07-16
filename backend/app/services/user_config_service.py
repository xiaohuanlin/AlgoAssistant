from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app import models, schemas
from app.schemas.gemini import GeminiConfig
from app.schemas.github import GitHubConfig
from app.schemas.google import GoogleConfig
from app.schemas.leetcode import LeetCodeConfig
from app.schemas.notion import NotionConfig
from app.utils.logger import default_logger


class UserConfigService:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self, user_id: int, config: schemas.UserConfigCreate
    ) -> models.UserConfig:
        default_logger.info(
            f"Creating user config for user {user_id} with config {config}"
        )
        db_config = models.UserConfig(
            user_id=user_id,
            github_config=config.github_config,
            leetcode_config=config.leetcode_config,
            notion_config=config.notion_config,
            gemini_config=config.gemini_config,
            google_config=config.google_config,
        )
        self.db.add(db_config)
        self.db.commit()
        self.db.refresh(db_config)
        return db_config

    def get(self, user_id: int) -> Optional[models.UserConfig]:
        return (
            self.db.query(models.UserConfig)
            .filter(models.UserConfig.user_id == user_id)
            .first()
        )

    def update(
        self, user_id: int, config: schemas.UserConfigCreate
    ) -> Optional[models.UserConfig]:
        db_config = self.get(user_id)
        if not db_config:
            return None
        if config.github_config:
            db_config.github_config = config.github_config
        if config.leetcode_config:
            db_config.leetcode_config = config.leetcode_config
        if config.notion_config:
            db_config.notion_config = config.notion_config
        if config.gemini_config:
            db_config.gemini_config = config.gemini_config
        if config.google_config:
            db_config.google_config = config.google_config
        self.db.commit()
        self.db.refresh(db_config)
        return db_config

    def delete(self, user_id: int) -> bool:
        db_config = self.get(user_id)
        if not db_config:
            return False
        self.db.delete(db_config)
        self.db.commit()
        return True
