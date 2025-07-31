"""Simplified tests for security utilities."""

from app.utils import security


class TestSecurityUtilsSimple:
    """Simplified test cases for security utilities."""

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "testpassword123"
        hashed = security.get_password_hash(password)

        assert security.verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = security.get_password_hash(password)

        assert security.verify_password(wrong_password, hashed) is False

    def test_get_password_hash(self):
        """Test password hashing generates a hash."""
        password = "testpassword123"
        hashed = security.get_password_hash(password)

        assert hashed is not None
        assert len(hashed) > 0
        assert hashed != password  # Hash should be different from original

    def test_get_password_hash_different_passwords(self):
        """Test that different passwords generate different hashes."""
        password1 = "testpassword123"
        password2 = "differentpassword456"

        hash1 = security.get_password_hash(password1)
        hash2 = security.get_password_hash(password2)

        assert hash1 != hash2

    def test_verify_token_valid(self):
        """Test token verification with valid token."""
        username = "testuser"
        token = security.create_access_token({"sub": username})

        payload = security.verify_token(token)

        assert payload is not None
        assert payload.get("sub") == username

    def test_verify_token_invalid(self):
        """Test token verification with invalid token."""
        import jwt

        invalid_token = "invalid.token.here"

        try:
            security.verify_token(invalid_token)
            raise AssertionError("Should have raised an exception")
        except jwt.InvalidTokenError:
            assert True  # Expected behavior
