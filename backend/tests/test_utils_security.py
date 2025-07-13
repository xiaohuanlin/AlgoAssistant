from datetime import datetime, timedelta
from unittest.mock import Mock, patch

import jwt
import pytest

from app.models import User
from app.utils.security import (
    create_access_token,
    get_current_active_user,
    get_current_user,
    get_password_hash,
    verify_password,
    verify_token,
)


class TestSecurityUtils:
    """Test cases for security utility functions."""

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "testpassword123"
        hashed_password = get_password_hash(password)

        assert verify_password(password, hashed_password) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed_password = get_password_hash(password)

        assert verify_password(wrong_password, hashed_password) is False

    def test_verify_password_empty(self):
        """Test password verification with empty password."""
        password = ""
        hashed_password = get_password_hash(password)

        assert verify_password(password, hashed_password) is True

    def test_get_password_hash(self):
        """Test password hashing."""
        password = "testpassword123"
        hashed_password = get_password_hash(password)

        assert hashed_password != password
        assert len(hashed_password) > len(password)
        assert hashed_password.startswith("$2b$")

    def test_get_password_hash_different_passwords(self):
        """Test that different passwords produce different hashes."""
        password1 = "password1"
        password2 = "password2"

        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)

        assert hash1 != hash2

    def test_get_password_hash_same_password_different_hashes(self):
        """Test that same password produces different hashes (due to salt)."""
        password = "testpassword"

        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes should be different due to salt
        assert hash1 != hash2
        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_create_access_token(self):
        """Test creating access token."""
        data = {"sub": "testuser"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

        # Decode token to verify content
        decoded = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
        assert decoded["sub"] == "testuser"

    def test_create_access_token_with_expires_delta(self):
        """Test creating access token with custom expiration."""
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=30)

        token = create_access_token(data, expires_delta=expires_delta)

        # Decode token to verify expiration
        decoded = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
        assert "exp" in decoded

        # Check that expiration is roughly 30 minutes from now
        exp_timestamp = decoded["exp"]
        now_timestamp = datetime.utcnow().timestamp()
        time_diff = exp_timestamp - now_timestamp

        assert 29 * 60 <= time_diff <= 31 * 60  # Allow 1 minute tolerance

    def test_create_access_token_without_expires_delta(self):
        """Test creating access token with default expiration."""
        data = {"sub": "testuser"}

        token = create_access_token(data)

        # Decode token to verify default expiration
        decoded = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
        assert "exp" in decoded

        # Check that expiration is roughly 15 minutes from now (default)
        exp_timestamp = decoded["exp"]
        now_timestamp = datetime.utcnow().timestamp()
        time_diff = exp_timestamp - now_timestamp

        assert 14 * 60 <= time_diff <= 16 * 60  # Allow 1 minute tolerance

    def test_verify_token_valid(self):
        """Test verifying valid token."""
        data = {"sub": "testuser"}
        token = create_access_token(data)

        payload = verify_token(token)

        assert payload is not None
        assert payload["sub"] == "testuser"

    def test_verify_token_invalid(self):
        """Test verifying invalid token."""
        invalid_token = "invalid.token.here"

        with pytest.raises(jwt.InvalidTokenError):
            verify_token(invalid_token)

    def test_verify_token_expired(self):
        """Test verifying expired token."""
        data = {"sub": "testuser"}
        # Create token with very short expiration
        token = create_access_token(data, expires_delta=timedelta(seconds=1))

        # Wait for token to expire
        import time

        time.sleep(2)

        with pytest.raises(jwt.ExpiredSignatureError):
            verify_token(token)

    def test_verify_token_wrong_secret(self):
        """Test verifying token with wrong secret key."""
        data = {"sub": "testuser"}
        token = create_access_token(data)

        # Try to decode with wrong secret
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, "wrong_secret", algorithms=["HS256"])

    @patch("app.utils.security.get_db")
    def test_get_current_user_valid(self, mock_get_db):
        """Test getting current user with valid token."""
        # Create mock database session
        mock_db = Mock()
        mock_get_db.return_value = mock_db

        # Create test user
        user = User(
            id=1,
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        mock_db.query.return_value.filter.return_value.first.return_value = user

        # Create valid token
        token = create_access_token({"sub": "testuser"})

        # Test function
        result = get_current_user(token, mock_db)

        assert result == user
        mock_db.query.assert_called_once()

    @patch("app.utils.security.get_db")
    def test_get_current_user_invalid_token(self, mock_get_db):
        """Test getting current user with invalid token."""
        mock_db = Mock()
        mock_get_db.return_value = mock_db

        invalid_token = "invalid.token.here"

        with pytest.raises(jwt.InvalidTokenError):
            get_current_user(invalid_token, mock_db)

    @patch("app.utils.security.get_db")
    def test_get_current_user_nonexistent_user(self, mock_get_db):
        """Test getting current user with non-existent user."""
        # Create mock database session
        mock_db = Mock()
        mock_get_db.return_value = mock_db

        # Mock database to return None (user not found)
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Create valid token for non-existent user
        token = create_access_token({"sub": "nonexistentuser"})

        with pytest.raises(Exception):
            get_current_user(token, mock_db)

    @patch("app.utils.security.get_db")
    def test_get_current_active_user_active(self, mock_get_db):
        """Test getting current active user with active user."""
        # Create mock database session
        mock_db = Mock()
        mock_get_db.return_value = mock_db

        # Create active test user
        user = User(
            id=1,
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
            is_active=True,
        )
        mock_db.query.return_value.filter.return_value.first.return_value = user

        # Create valid token
        token = create_access_token({"sub": "testuser"})

        # Test function
        result = get_current_active_user(token, mock_db)

        assert result == user

    @patch("app.utils.security.get_db")
    def test_get_current_active_user_inactive(self, mock_get_db):
        """Test getting current active user with inactive user."""
        # Create mock database session
        mock_db = Mock()
        mock_get_db.return_value = mock_db

        # Create inactive test user
        user = User(
            id=1,
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
            is_active=False,
        )
        mock_db.query.return_value.filter.return_value.first.return_value = user

        # Create valid token
        token = create_access_token({"sub": "testuser"})

        with pytest.raises(Exception):
            get_current_active_user(token, mock_db)

    def test_password_complexity(self):
        """Test password hashing with complex passwords."""
        complex_passwords = [
            "VeryLongPassword123!@#",
            "P@ssw0rd",
            "1234567890abcdef",
            "!@#$%^&*()_+-=",
            "a" * 100,  # Very long password
            "A" * 100,  # Very long password with caps
        ]

        for password in complex_passwords:
            hashed = get_password_hash(password)
            assert verify_password(password, hashed) is True
            assert verify_password(password + "wrong", hashed) is False

    def test_token_payload_structure(self):
        """Test that token payload contains expected fields."""
        data = {"sub": "testuser", "custom_field": "custom_value"}
        token = create_access_token(data)

        payload = verify_token(token)

        assert "sub" in payload
        assert "exp" in payload
        assert "iat" in payload
        assert payload["sub"] == "testuser"
        assert payload["custom_field"] == "custom_value"

    def test_token_algorithm(self):
        """Test that tokens are created with correct algorithm."""
        data = {"sub": "testuser"}
        token = create_access_token(data)

        # Decode without specifying algorithm should fail
        with pytest.raises(jwt.InvalidTokenError):
            jwt.decode(token, "test_secret_key")

        # Decode with correct algorithm should succeed
        payload = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
        assert payload["sub"] == "testuser"

    def test_token_secret_key(self):
        """Test that tokens use the correct secret key."""
        data = {"sub": "testuser"}
        token = create_access_token(data)

        # Try to decode with wrong secret key
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, "wrong_secret_key", algorithms=["HS256"])

        # Decode with correct secret key
        payload = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
        assert payload["sub"] == "testuser"
