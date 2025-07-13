from typing import Optional

from sqlalchemy.orm import Session

from app import models, schemas
from app.schemas.user import UserCreate, UserOut
from app.utils import security


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_username(self, username: str) -> Optional[models.User]:
        """Get a user by username."""
        return (
            self.db.query(models.User).filter(models.User.username == username).first()
        )

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
            avatar=user.avatar,
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def get_user(self, user_id: int) -> Optional[models.User]:
        return self.db.query(models.User).filter(models.User.id == user_id).first()

    def update_user(
        self, user_id: int, user: schemas.UserUpdate
    ) -> Optional[models.User]:
        db_user = self.get_user(user_id)
        if not db_user:
            return None
        db_user.username = user.username
        db_user.email = user.email
        db_user.nickname = user.nickname
        db_user.avatar = user.avatar
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def delete_user(self, user_id: int) -> bool:
        db_user = self.get_user(user_id)
        if not db_user:
            return False
        self.db.delete(db_user)
        self.db.commit()
        return True
