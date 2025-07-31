from typing import Optional

from sqlalchemy.orm import Session

from app import models, schemas
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services.base_db_service import BaseDBService
from app.utils import security


class UserService(BaseDBService[models.User, UserCreate, UserUpdate]):
    def __init__(self, db: Session):
        super().__init__(db, models.User)

    def get_user_by_username(self, username: str) -> Optional[models.User]:
        """Get a user by username."""
        return self.get_by_field("username", username)

    def get_user_by_email(self, email: str) -> Optional[models.User]:
        """Get a user by email."""
        return self.get_by_field("email", email)

    def create_user(self, user: schemas.UserCreate) -> models.User:
        """Create a new user with hashed password."""
        user_data = user.model_dump()
        user_data["password_hash"] = security.get_password_hash(
            user_data.pop("password")
        )

        db_user = models.User(**user_data)
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def get_user(self, user_id: int) -> Optional[models.User]:
        """Get user by ID - wrapper for base get method."""
        return self.get(user_id)

    def update_user(
        self, user_id: int, user: schemas.UserUpdate
    ) -> Optional[models.User]:
        """Update user - enhanced wrapper for base update method."""
        db_user = self.get_user(user_id)
        if not db_user:
            return None
        return self.update(db_user, user)

    def delete_user(self, user_id: int) -> bool:
        """Delete user - wrapper for base delete method."""
        return self.delete(user_id)
