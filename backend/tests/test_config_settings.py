"""Tests for configuration settings."""

import os
from unittest.mock import Mock, patch

import pytest

from app.config.settings import Settings


class TestSettings:
    """Test cases for Settings configuration."""

    def test_default_settings_values(self):
        """Test default configuration values."""
        settings = Settings()

        # Database defaults
        assert (
            settings.DATABASE_URL
            == "postgresql://postgres:postgres@localhost:5432/algo_assistant"
        )

        # Security defaults
        assert settings.SECRET_KEY == "your-secret-key-change-in-production"
        assert settings.FERNET_KEY == "your-32-byte-base64-encoded-fernet-key"
        assert settings.ALGORITHM == "HS256"
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 30

        # Google OAuth defaults
        assert settings.GOOGLE_CLIENT_ID == "your-google-client-id"
        assert settings.GOOGLE_CLIENT_SECRET == "your-google-client-secret"
        assert (
            settings.GOOGLE_REDIRECT_URI == "http://localhost:8000/api/google/callback"
        )

        # Redis defaults
        assert settings.REDIS_URL == "redis://localhost:6379/0"

        # Rate limiting defaults
        assert settings.USER_RATE_LIMIT_DELAY == 2.0
        assert settings.MAX_SUBMISSIONS_PER_USER == 1000

        # Queue names
        assert settings.LEETCODE_QUEUE_NAME == "leetcode_sync_queue"
        assert settings.GIT_QUEUE_NAME == "git_sync_queue"

        # Consumer settings
        assert settings.CONSUMER_BATCH_SIZE == 5
        assert settings.DB_CONNECTION_TIMEOUT == 300

    def test_rate_limit_configurations(self):
        """Test rate limit configuration structures."""
        settings = Settings()

        # LeetCode rate limit
        leetcode_config = settings.LEETCODE_RATE_LIMIT
        assert leetcode_config["max_requests"] == 10
        assert leetcode_config["window_seconds"] == 60
        assert leetcode_config["operation"] == "leetcode_graphql"

        # GitHub rate limit
        git_config = settings.GIT_RATE_LIMIT
        assert git_config["max_requests"] == 5
        assert git_config["window_seconds"] == 60
        assert git_config["operation"] == "github_api"

    @patch.dict(
        os.environ,
        {
            "DATABASE_URL": "postgresql://test:test@testhost:5432/testdb",
            "SECRET_KEY": "test-secret-key",
            "REDIS_URL": "redis://testhost:6379/1",
            "ACCESS_TOKEN_EXPIRE_MINUTES": "60",
            "USER_RATE_LIMIT_DELAY": "5.0",
            "MAX_SUBMISSIONS_PER_USER": "2000",
        },
    )
    def test_environment_variable_override(self):
        """Test that environment variables override default values."""
        settings = Settings()

        assert settings.DATABASE_URL == "postgresql://test:test@testhost:5432/testdb"
        assert settings.SECRET_KEY == "test-secret-key"
        assert settings.REDIS_URL == "redis://testhost:6379/1"
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 60
        assert settings.USER_RATE_LIMIT_DELAY == 5.0
        assert settings.MAX_SUBMISSIONS_PER_USER == 2000

    @patch.dict(
        os.environ,
        {
            "GOOGLE_CLIENT_ID": "test-client-id",
            "GOOGLE_CLIENT_SECRET": "test-client-secret",
            "GOOGLE_REDIRECT_URI": "https://example.com/callback",
        },
    )
    def test_google_oauth_configuration(self):
        """Test Google OAuth configuration from environment."""
        settings = Settings()

        assert settings.GOOGLE_CLIENT_ID == "test-client-id"
        assert settings.GOOGLE_CLIENT_SECRET == "test-client-secret"
        assert settings.GOOGLE_REDIRECT_URI == "https://example.com/callback"

    @patch.dict(
        os.environ,
        {
            "LEETCODE_QUEUE_NAME": "custom_leetcode_queue",
            "GIT_QUEUE_NAME": "custom_git_queue",
            "CONSUMER_BATCH_SIZE": "10",
            "DB_CONNECTION_TIMEOUT": "600",
        },
    )
    def test_queue_and_consumer_configuration(self):
        """Test queue and consumer configuration from environment."""
        settings = Settings()

        assert settings.LEETCODE_QUEUE_NAME == "custom_leetcode_queue"
        assert settings.GIT_QUEUE_NAME == "custom_git_queue"
        assert settings.CONSUMER_BATCH_SIZE == 10
        assert settings.DB_CONNECTION_TIMEOUT == 600

    def test_settings_model_config(self):
        """Test that Settings has proper Pydantic model configuration."""
        settings = Settings()

        # Check that model_config is properly set
        assert hasattr(settings, "model_config")
        assert settings.model_config.env_file == ".env"

    @patch.dict(os.environ, {}, clear=True)
    def test_settings_without_env_file(self):
        """Test settings creation when .env file doesn't exist."""
        # This should work with default values
        settings = Settings()

        # Should still have default values
        assert (
            settings.DATABASE_URL
            == "postgresql://postgres:postgres@localhost:5432/algo_assistant"
        )
        assert settings.SECRET_KEY == "your-secret-key-change-in-production"

    def test_settings_types(self):
        """Test that settings have correct types."""
        settings = Settings()

        # String types
        assert isinstance(settings.DATABASE_URL, str)
        assert isinstance(settings.SECRET_KEY, str)
        assert isinstance(settings.FERNET_KEY, str)
        assert isinstance(settings.ALGORITHM, str)
        assert isinstance(settings.REDIS_URL, str)

        # Integer types
        assert isinstance(settings.ACCESS_TOKEN_EXPIRE_MINUTES, int)
        assert isinstance(settings.MAX_SUBMISSIONS_PER_USER, int)
        assert isinstance(settings.CONSUMER_BATCH_SIZE, int)
        assert isinstance(settings.DB_CONNECTION_TIMEOUT, int)

        # Float types
        assert isinstance(settings.USER_RATE_LIMIT_DELAY, float)

        # Dict types
        assert isinstance(settings.LEETCODE_RATE_LIMIT, dict)
        assert isinstance(settings.GIT_RATE_LIMIT, dict)

    def test_sensitive_fields_not_logged(self):
        """Test that sensitive fields are properly handled."""
        settings = Settings()

        # These should exist but we shouldn't log them
        sensitive_fields = ["SECRET_KEY", "FERNET_KEY", "GOOGLE_CLIENT_SECRET"]

        for field in sensitive_fields:
            assert hasattr(settings, field)
            # In production, these should not be default values
            # This test just ensures the fields exist

    @patch.dict(
        os.environ,
        {
            "FERNET_KEY": "dGVzdC1mZXJuZXQta2V5LWZvci10ZXN0aW5nLTEyMzQ1Njc4",  # Base64 encoded
        },
    )
    def test_fernet_key_configuration(self):
        """Test Fernet key configuration."""
        settings = Settings()

        assert settings.FERNET_KEY == "dGVzdC1mZXJuZXQta2V5LWZvci10ZXN0aW5nLTEyMzQ1Njc4"


class TestSettingsValidation:
    """Test cases for settings validation and edge cases."""

    @patch.dict(os.environ, {"ACCESS_TOKEN_EXPIRE_MINUTES": "invalid_int"})
    def test_invalid_integer_environment_variable(self):
        """Test that invalid integer environment variables raise errors."""
        with pytest.raises(ValueError):
            Settings()

    @patch.dict(os.environ, {"USER_RATE_LIMIT_DELAY": "invalid_float"})
    def test_invalid_float_environment_variable(self):
        """Test that invalid float environment variables raise errors."""
        with pytest.raises(ValueError):
            Settings()

    @patch.dict(os.environ, {"ACCESS_TOKEN_EXPIRE_MINUTES": "0"})
    def test_zero_token_expire_minutes(self):
        """Test edge case of zero token expiration."""
        settings = Settings()
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 0

    @patch.dict(os.environ, {"USER_RATE_LIMIT_DELAY": "0.0"})
    def test_zero_rate_limit_delay(self):
        """Test edge case of zero rate limit delay."""
        settings = Settings()
        assert settings.USER_RATE_LIMIT_DELAY == 0.0
