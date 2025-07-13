from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from app.models import User
from app.services.user_service import UserService
from app.utils.security import get_password_hash


class TestUserService:
    """Test cases for UserService."""

    def test_create_user_success(self, client):
        """Test creating a new user successfully."""
        # Get database session from dependency override
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }

        user = service.create_user(**user_data)

        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.nickname == "Test User"
        assert user.is_active is True
        assert user.created_at is not None
        # Password should be hashed
        assert user.hashed_password != "testpassword123"
        assert service.verify_password("testpassword123", user.hashed_password)

    def test_create_user_duplicate_username(self, client):
        """Test creating user with duplicate username fails."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create first user
        user_data = {
            "username": "testuser",
            "email": "test1@example.com",
            "password": "testpassword123",
            "nickname": "Test User 1",
        }
        service.create_user(**user_data)

        # Try to create second user with same username
        duplicate_data = {
            "username": "testuser",
            "email": "test2@example.com",
            "password": "testpassword123",
            "nickname": "Test User 2",
        }

        with pytest.raises(Exception):
            service.create_user(**duplicate_data)

    def test_create_user_duplicate_email(self, client):
        """Test creating user with duplicate email fails."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create first user
        user_data = {
            "username": "testuser1",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User 1",
        }
        service.create_user(**user_data)

        # Try to create second user with same email
        duplicate_data = {
            "username": "testuser2",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User 2",
        }

        with pytest.raises(Exception):
            service.create_user(**duplicate_data)

    def test_get_user_by_id(self, client):
        """Test getting user by ID."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create a user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        created_user = service.create_user(**user_data)

        # Get user by ID
        retrieved_user = service.get_user_by_id(created_user.id)

        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.username == "testuser"

    def test_get_user_by_username(self, client):
        """Test getting user by username."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create a user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        service.create_user(**user_data)

        # Get user by username
        retrieved_user = service.get_user_by_username("testuser")

        assert retrieved_user is not None
        assert retrieved_user.username == "testuser"
        assert retrieved_user.email == "test@example.com"

    def test_get_user_by_email(self, client):
        """Test getting user by email."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create a user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        service.create_user(**user_data)

        # Get user by email
        retrieved_user = service.get_user_by_email("test@example.com")

        assert retrieved_user is not None
        assert retrieved_user.email == "test@example.com"
        assert retrieved_user.username == "testuser"

    def test_authenticate_user_success(self, client):
        """Test successful user authentication."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create a user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        service.create_user(**user_data)

        # Authenticate user
        authenticated_user = service.authenticate_user("testuser", "testpassword123")

        assert authenticated_user is not None
        assert authenticated_user.username == "testuser"

    def test_authenticate_user_wrong_password(self, client):
        """Test user authentication with wrong password."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create a user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        service.create_user(**user_data)

        # Try to authenticate with wrong password
        authenticated_user = service.authenticate_user("testuser", "wrongpassword")

        assert authenticated_user is None

    def test_authenticate_user_nonexistent(self, client):
        """Test authentication with non-existent user."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Try to authenticate non-existent user
        authenticated_user = service.authenticate_user("nonexistent", "password")

        assert authenticated_user is None

    def test_update_user(self, client):
        """Test updating user information."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create a user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        created_user = service.create_user(**user_data)

        # Update user
        update_data = {"nickname": "Updated User", "email": "updated@example.com"}
        updated_user = service.update_user(created_user.id, update_data)

        assert updated_user.nickname == "Updated User"
        assert updated_user.email == "updated@example.com"
        assert updated_user.username == "testuser"  # Should remain unchanged

    def test_deactivate_user(self, client):
        """Test deactivating a user."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create a user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        created_user = service.create_user(**user_data)

        # Deactivate user
        deactivated_user = service.deactivate_user(created_user.id)

        assert deactivated_user.is_active is False

    def test_activate_user(self, client):
        """Test activating a user."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create a user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        created_user = service.create_user(**user_data)

        # Deactivate user first
        service.deactivate_user(created_user.id)

        # Activate user
        activated_user = service.activate_user(created_user.id)

        assert activated_user.is_active is True

    def test_change_password(self, client):
        """Test changing user password."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create a user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        created_user = service.create_user(**user_data)

        # Change password
        new_password = "newpassword123"
        updated_user = service.change_password(created_user.id, new_password)

        # Verify old password doesn't work
        assert not service.verify_password(
            "testpassword123", updated_user.hashed_password
        )

        # Verify new password works
        assert service.verify_password(new_password, updated_user.hashed_password)

    def test_get_users_pagination(self, client):
        """Test getting users with pagination."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create multiple users
        for i in range(5):
            user_data = {
                "username": f"testuser{i}",
                "email": f"test{i}@example.com",
                "password": "testpassword123",
                "nickname": f"Test User {i}",
            }
            service.create_user(**user_data)

        # Get users with pagination
        users = service.get_users(skip=0, limit=3)
        assert len(users) == 3

        users = service.get_users(skip=3, limit=3)
        assert len(users) == 2  # Only 2 users remaining

    def test_search_users(self, client):
        """Test searching users."""
        from app.deps import get_db

        db = next(get_db())

        service = UserService(db)

        # Create users with different usernames
        user_data1 = {
            "username": "alice_user",
            "email": "alice@example.com",
            "password": "testpassword123",
            "nickname": "Alice",
        }
        user_data2 = {
            "username": "bob_user",
            "email": "bob@example.com",
            "password": "testpassword123",
            "nickname": "Bob",
        }
        service.create_user(**user_data1)
        service.create_user(**user_data2)

        # Search for users with "alice"
        results = service.search_users("alice")
        assert len(results) == 1
        assert results[0].username == "alice_user"

        # Search for users with "user"
        results = service.search_users("user")
        assert len(results) == 2
