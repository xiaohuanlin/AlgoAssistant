from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app import models, schemas
from app.schemas.ai import AIConfig
from app.schemas.github import GitHubConfig
from app.schemas.google import GoogleConfig
from app.schemas.leetcode import LeetCodeConfig
from app.schemas.notion import NotionConfig


class UserConfigService:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self, user_id: int, config: schemas.UserConfigCreate
    ) -> models.UserConfig:
        db_config = models.UserConfig(
            user_id=user_id,
            github_config=config.github_config.dict() if config.github_config else None,
            leetcode_config=config.leetcode_config.dict()
            if config.leetcode_config
            else None,
            notion_config=config.notion_config.dict() if config.notion_config else None,
            ai_config=config.ai_config.dict() if config.ai_config else None,
            google_config=config.google_config.dict() if config.google_config else None,
        )
        self.db.add(db_config)
        self.db.commit()
        self.db.refresh(db_config)
        return db_config

    def get(self, user_id: int) -> Optional[models.UserConfig]:
        db_config = (
            self.db.query(models.UserConfig)
            .filter(models.UserConfig.user_id == user_id)
            .first()
        )
        if not db_config:
            return None
        if db_config.github_config:
            db_config.github_config = GitHubConfig(**db_config.github_config)
        if db_config.leetcode_config:
            db_config.leetcode_config = LeetCodeConfig(**db_config.leetcode_config)
        if db_config.notion_config:
            db_config.notion_config = NotionConfig(**db_config.notion_config)
        if db_config.ai_config:
            db_config.ai_config = AIConfig(**db_config.ai_config)
        if db_config.google_config:
            db_config.google_config = GoogleConfig(**db_config.google_config)
        return db_config

    def update(
        self, user_id: int, config: schemas.UserConfigCreate
    ) -> Optional[models.UserConfig]:
        db_config = (
            self.db.query(models.UserConfig)
            .filter(models.UserConfig.user_id == user_id)
            .first()
        )
        if not db_config:
            return None
        db_config.github_config = (
            config.github_config.dict() if config.github_config else None
        )
        db_config.leetcode_config = (
            config.leetcode_config.dict() if config.leetcode_config else None
        )
        db_config.notion_config = (
            config.notion_config.dict() if config.notion_config else None
        )
        db_config.ai_config = config.ai_config.dict() if config.ai_config else None
        db_config.google_config = (
            config.google_config.dict() if config.google_config else None
        )
        db_config.updated_at = datetime.utcnow()
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

    def get_github_config(self, user_id: int) -> Optional[GitHubConfig]:
        db_config = self.get(user_id)
        if db_config and db_config.github_config:
            return db_config.github_config
        return None

    def get_leetcode_config(self, user_id: int) -> Optional[LeetCodeConfig]:
        db_config = self.get(user_id)
        if db_config and db_config.leetcode_config:
            return db_config.leetcode_config
        return None

    def get_notion_config(self, user_id: int) -> Optional[NotionConfig]:
        db_config = self.get(user_id)
        if db_config and db_config.notion_config:
            return db_config.notion_config
        return None

    def get_ai_config(self, user_id: int) -> Optional[AIConfig]:
        db_config = self.get(user_id)
        if db_config and db_config.ai_config:
            return db_config.ai_config
        return None

    def get_google_config(self, user_id: int) -> Optional[GoogleConfig]:
        db_config = self.get(user_id)
        if db_config and db_config.google_config:
            return db_config.google_config
        return None
