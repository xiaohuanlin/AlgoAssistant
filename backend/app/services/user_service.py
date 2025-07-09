from sqlalchemy.orm import Session
from typing import Optional
from app import models, schemas
from app.utils import security

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_username(self, username: str) -> Optional[models.User]:
        """Get a user by username."""
        return self.db.query(models.User).filter(models.User.username == username).first()

    def get_user_by_email(self, email: str) -> Optional[models.User]:
        """Get a user by email."""
        return self.db.query(models.User).filter(models.User.email == email).first()

    def create_user(self, user: schemas.UserCreate) -> models.User:
        """Create a new user with hashed password."""
        hashed_password = security.get_password_hash(user.password)
        db_user = models.User(
            username=user.username,
            email=user.email,
            password_hash=hashed_password,
            nickname=user.nickname,
            avatar=user.avatar
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def create_user_config(self, user_id: int, config: schemas.UserConfigCreate) -> models.UserConfig:
        """Create user third-party config with encrypted sensitive fields."""
        db_config = models.UserConfig(
            user_id=user_id,
            leetcode_name=config.leetcode_name,
            github_repo=config.github_repo,
            notion_token=security.encrypt_data(config.notion_token) if config.notion_token else None,
            notion_db_id=config.notion_db_id,
            openai_key=security.encrypt_data(config.openai_key) if config.openai_key else None
        )
        self.db.add(db_config)
        self.db.commit()
        self.db.refresh(db_config)
        return db_config

    def get_user_config(self, user_id: int) -> Optional[models.UserConfig]:
        """Get user config."""
        return self.db.query(models.UserConfig).filter(models.UserConfig.user_id == user_id).first()

    def update_user_config(self, user_id: int, config: schemas.UserConfigCreate) -> Optional[models.UserConfig]:
        """Update user config with encrypted sensitive fields."""
        db_config = self.db.query(models.UserConfig).filter(models.UserConfig.user_id == user_id).first()
        if not db_config:
            return None
        db_config.leetcode_name = config.leetcode_name
        db_config.github_repo = config.github_repo
        db_config.notion_token = security.encrypt_data(config.notion_token) if config.notion_token else None
        db_config.notion_db_id = config.notion_db_id
        db_config.openai_key = security.encrypt_data(config.openai_key) if config.openai_key else None
        self.db.commit()
        self.db.refresh(db_config)
        return db_config 