"""Tests for security utility functions."""

import base64
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

import jwt
import pytest
from cryptography.fernet import Fernet, InvalidToken

from app.utils.security import (
    create_access_token,
    decrypt_data,
    encrypt_data,
    get_current_active_user,
    get_current_user,
    get_fernet,
    get_password_hash,
    verify_password,
    verify_token,
)


class TestPasswordHandling:
    """Test cases for password hashing and verification."""

    def test_get_password_hash_creates_hash(self):
        """Test that get_password_hash creates a bcrypt hash."""
        password = "test_password_123"
        hashed = get_password_hash(password)

        # Bcrypt hashes start with $2b$
        assert hashed.startswith("$2b$")
        assert len(hashed) == 60  # Standard bcrypt hash length
        assert hashed != password  # Should be different from plain password

    def test_get_password_hash_different_for_same_password(self):
        """Test that same password generates different hashes (salt)."""
        password = "same_password"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Should be different due to salt
        assert hash1 != hash2
        # But both should verify against the original password
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)

    def test_verify_password_correct_password(self):
        """Test verify_password with correct password."""
        password = "correct_password"
        hashed = get_password_hash(password)

        result = verify_password(password, hashed)
        assert result is True

    def test_verify_password_incorrect_password(self):
        """Test verify_password with incorrect password."""
        correct_password = "correct_password"
        wrong_password = "wrong_password"
        hashed = get_password_hash(correct_password)

        result = verify_password(wrong_password, hashed)
        assert result is False

    def test_verify_password_empty_password(self):
        """Test verify_password with empty password."""
        password = "test_password"
        hashed = get_password_hash(password)

        result = verify_password("", hashed)
        assert result is False

    def test_verify_password_invalid_hash(self):
        """Test verify_password with invalid hash format."""
        password = "test_password"
        invalid_hash = "not_a_valid_hash"

        with pytest.raises(ValueError):
            verify_password(password, invalid_hash)


class TestJWTTokenHandling:
    """Test cases for JWT token creation and verification."""

    @patch("app.utils.security.settings")
    def test_create_access_token_basic(self, mock_settings):
        """Test creating a basic JWT access token."""
        mock_settings.SECRET_KEY = "test_secret_key"

        data = {"sub": "testuser", "user_id": 123}
        token = create_access_token(data)

        # Should be a string
        assert isinstance(token, str)
        # Should have 3 parts (header.payload.signature)
        assert len(token.split(".")) == 3

    @patch("app.utils.security.settings")
    @patch("app.utils.security.datetime")
    def test_create_access_token_with_expiry(self, mock_datetime, mock_settings):
        """Test creating token with custom expiry."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        data = {"sub": "testuser"}
        expires_delta = timedelta(hours=2)
        token = create_access_token(data, expires_delta)

        # Decode to verify expiry time
        payload = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
        expected_exp = int(mock_now.timestamp()) + 7200  # 2 hours
        assert payload["exp"] == expected_exp

    @patch("app.utils.security.settings")
    @patch("app.utils.security.datetime")
    def test_create_access_token_default_expiry(self, mock_datetime, mock_settings):
        """Test creating token with default 15-minute expiry."""
        mock_settings.SECRET_KEY = "test_secret_key"
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = mock_now

        data = {"sub": "testuser"}
        token = create_access_token(data)

        payload = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
        expected_exp = int(mock_now.timestamp()) + 900  # 15 minutes
        assert payload["exp"] == expected_exp

    @patch("app.utils.security.settings")
    def test_verify_token_valid(self, mock_settings):
        """Test verifying a valid JWT token."""
        mock_settings.SECRET_KEY = "test_secret_key"

        data = {"sub": "testuser", "user_id": 123}
        token = create_access_token(data)

        payload = verify_token(token)

        assert payload["sub"] == "testuser"
        assert payload["user_id"] == 123
        assert "exp" in payload

    @patch("app.utils.security.settings")
    def test_verify_token_invalid_signature(self, mock_settings):
        """Test verifying token with invalid signature."""
        mock_settings.SECRET_KEY = "test_secret_key"

        # Create token with one key, verify with another
        data = {"sub": "testuser"}
        token = jwt.encode(data, "wrong_key", algorithm="HS256")

        with pytest.raises(jwt.InvalidTokenError):
            verify_token(token)

    @patch("app.utils.security.settings")
    def test_verify_token_expired(self, mock_settings):
        """Test verifying an expired token."""
        mock_settings.SECRET_KEY = "test_secret_key"

        # Create an already expired token
        data = {
            "sub": "testuser",
            "exp": int(datetime.utcnow().timestamp()) - 3600,  # 1 hour ago
        }
        token = jwt.encode(data, "test_secret_key", algorithm="HS256")

        with pytest.raises(jwt.ExpiredSignatureError):
            verify_token(token)

    def test_verify_token_malformed(self):
        """Test verifying a malformed token."""
        malformed_token = "not.a.valid.jwt.token"

        with pytest.raises(jwt.InvalidTokenError):
            verify_token(malformed_token)


class TestUserAuthentication:
    """Test cases for user authentication functions."""

    @patch("app.utils.security.verify_token")
    def test_get_current_user_success(self, mock_verify_token):
        """Test successful user retrieval from token."""
        # Mock database and user
        mock_db = Mock()
        mock_user = Mock()
        mock_user.username = "testuser"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user

        # Mock token verification
        mock_verify_token.return_value = {"sub": "testuser"}

        result = get_current_user("valid_token", mock_db)

        assert result == mock_user
        mock_verify_token.assert_called_once_with("valid_token")

    @patch("app.utils.security.verify_token")
    def test_get_current_user_no_username_in_token(self, mock_verify_token):
        """Test get_current_user when token has no username."""
        mock_db = Mock()
        mock_verify_token.return_value = {"user_id": 123}  # No 'sub' field

        with pytest.raises(
            jwt.InvalidTokenError, match="Could not validate credentials"
        ):
            get_current_user("token_without_username", mock_db)

    @patch("app.utils.security.verify_token")
    def test_get_current_user_user_not_found(self, mock_verify_token):
        """Test get_current_user when user doesn't exist in database."""
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_verify_token.return_value = {"sub": "nonexistent_user"}

        with pytest.raises(Exception, match="User not found"):
            get_current_user("valid_token", mock_db)

    @patch("app.utils.security.get_current_user")
    def test_get_current_active_user_active(self, mock_get_current_user):
        """Test get_current_active_user with active user."""
        mock_user = Mock()
        mock_user.is_active = True
        mock_get_current_user.return_value = mock_user

        result = get_current_active_user("token", "db")

        assert result == mock_user

    @patch("app.utils.security.get_current_user")
    def test_get_current_active_user_inactive(self, mock_get_current_user):
        """Test get_current_active_user with inactive user."""
        mock_user = Mock()
        mock_user.is_active = False
        mock_get_current_user.return_value = mock_user

        with pytest.raises(Exception, match="Inactive user"):
            get_current_active_user("token", "db")


class TestDataEncryption:
    """Test cases for data encryption and decryption."""

    @patch("app.utils.security.settings")
    def test_get_fernet_with_valid_key(self, mock_settings):
        """Test getting Fernet instance with valid key."""
        # 32-byte key encoded in base64
        valid_key = base64.urlsafe_b64encode(b"0" * 32).decode()
        mock_settings.FERNET_KEY = valid_key

        fernet_instance = get_fernet()

        assert isinstance(fernet_instance, Fernet)

    @patch("app.utils.security.settings")
    def test_get_fernet_with_short_key(self, mock_settings):
        """Test getting Fernet instance with short key (auto-padded)."""
        mock_settings.FERNET_KEY = "short_key"

        fernet_instance = get_fernet()

        assert isinstance(fernet_instance, Fernet)

    @patch("app.utils.security.get_fernet")
    def test_encrypt_data_success(self, mock_get_fernet):
        """Test successful data encryption."""
        mock_fernet = Mock()
        mock_fernet.encrypt.return_value = b"encrypted_data"
        mock_get_fernet.return_value = mock_fernet

        result = encrypt_data("test_data")

        assert result == "encrypted_data"
        mock_fernet.encrypt.assert_called_once_with(b"test_data")

    @patch("app.utils.security.get_fernet")
    def test_decrypt_data_success(self, mock_get_fernet):
        """Test successful data decryption."""
        mock_fernet = Mock()
        mock_fernet.decrypt.return_value = b"decrypted_data"
        mock_get_fernet.return_value = mock_fernet

        result = decrypt_data("encrypted_token")

        assert result == "decrypted_data"
        mock_fernet.decrypt.assert_called_once_with(b"encrypted_token")

    @patch("app.utils.security.get_fernet")
    def test_decrypt_data_invalid_token(self, mock_get_fernet):
        """Test decryption with invalid token."""
        mock_fernet = Mock()
        mock_fernet.decrypt.side_effect = InvalidToken("Invalid token")
        mock_get_fernet.return_value = mock_fernet

        result = decrypt_data("invalid_token")

        # Should return empty string on invalid token
        assert result == ""

    def test_encrypt_decrypt_roundtrip(self):
        """Test that encryption and decryption work together."""
        # Use a real Fernet key for roundtrip test
        with patch("app.utils.security.settings") as mock_settings:
            real_key = Fernet.generate_key().decode()
            mock_settings.FERNET_KEY = real_key

            original_data = "sensitive_test_data"

            # Encrypt then decrypt
            encrypted = encrypt_data(original_data)
            decrypted = decrypt_data(encrypted)

            assert original_data == decrypted
            assert encrypted != original_data  # Should be different when encrypted

    def test_encrypt_empty_string(self):
        """Test encrypting empty string."""
        with patch("app.utils.security.settings") as mock_settings:
            real_key = Fernet.generate_key().decode()
            mock_settings.FERNET_KEY = real_key

            encrypted = encrypt_data("")
            decrypted = decrypt_data(encrypted)

            assert decrypted == ""


class TestSecurityIntegration:
    """Integration tests for security functions."""

    @patch("app.utils.security.settings")
    def test_full_authentication_flow(self, mock_settings):
        """Test complete authentication flow."""
        mock_settings.SECRET_KEY = "test_secret_key"

        # 1. Hash password
        password = "user_password"
        hashed_password = get_password_hash(password)

        # 2. Verify password
        assert verify_password(password, hashed_password)

        # 3. Create token
        user_data = {"sub": "testuser", "user_id": 123}
        token = create_access_token(user_data)

        # 4. Verify token
        payload = verify_token(token)
        assert payload["sub"] == "testuser"
        assert payload["user_id"] == 123

    def test_password_security_properties(self):
        """Test security properties of password hashing."""
        passwords = ["password123", "P@ssw0rd!", "", "a" * 100]

        for password in passwords:
            hashed = get_password_hash(password)

            # Hash should be different from password
            assert hashed != password

            # Hash should verify correctly
            assert verify_password(password, hashed)

            # Wrong password should not verify
            assert not verify_password(password + "wrong", hashed)
