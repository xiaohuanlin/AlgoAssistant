"""Tests for Redis rate limiter utility."""

import time
from unittest.mock import MagicMock, Mock, patch

import pytest

from app.utils.rate_limiter import RedisRateLimiter, get_global_rate_limiter


class TestRedisRateLimiter:
    """Test cases for RedisRateLimiter."""

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    def test_init_creates_redis_client(self, mock_get_redis_client):
        """Test that RedisRateLimiter initializes with Redis client."""
        mock_redis = Mock()
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter("test_prefix")

        assert limiter.redis_client == mock_redis
        assert limiter.prefix == "test_prefix"

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    def test_get_key_generation(self, mock_get_redis_client):
        """Test Redis key generation."""
        mock_redis = Mock()
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter("rate_limit")

        # Test default operation
        key = limiter._get_key(123)
        assert key == "rate_limit:123:default"

        # Test custom operation
        key = limiter._get_key(456, "api_call")
        assert key == "rate_limit:456:api_call"

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    @patch("app.utils.rate_limiter.time.time")
    def test_is_allowed_under_limit(self, mock_time, mock_get_redis_client):
        """Test is_allowed returns True when under rate limit."""
        mock_time.return_value = 1000
        mock_redis = Mock()
        mock_redis.zremrangebyscore.return_value = None
        mock_redis.zcard.return_value = 5  # Current requests
        mock_redis.zadd.return_value = None
        mock_redis.expire.return_value = None
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        # 5 requests < 10 max_requests, should be allowed
        result = limiter.is_allowed(user_id=123, max_requests=10, window_seconds=60)

        assert result is True
        mock_redis.zremrangebyscore.assert_called_once_with(
            "rate_limit:123:default", 0, 940
        )
        mock_redis.zcard.assert_called_once_with("rate_limit:123:default")
        mock_redis.zadd.assert_called_once_with(
            "rate_limit:123:default", {"1000": 1000}
        )
        mock_redis.expire.assert_called_once_with("rate_limit:123:default", 120)

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    @patch("app.utils.rate_limiter.time.time")
    def test_is_allowed_over_limit(self, mock_time, mock_get_redis_client):
        """Test is_allowed returns False when over rate limit."""
        mock_time.return_value = 1000
        mock_redis = Mock()
        mock_redis.zremrangebyscore.return_value = None
        mock_redis.zcard.return_value = 10  # Current requests = max
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        result = limiter.is_allowed(user_id=123, max_requests=10, window_seconds=60)

        assert result is False
        mock_redis.zadd.assert_not_called()  # Should not add new request

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    def test_is_allowed_redis_exception(self, mock_get_redis_client):
        """Test is_allowed handles Redis exceptions gracefully."""
        mock_redis = Mock()
        mock_redis.zremrangebyscore.side_effect = Exception("Redis error")
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        # Should return True on error to avoid blocking
        result = limiter.is_allowed(user_id=123, max_requests=10, window_seconds=60)

        assert result is True

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    @patch("app.utils.rate_limiter.time.time")
    @patch("app.utils.rate_limiter.time.sleep")
    def test_wait_if_needed_no_wait(self, mock_sleep, mock_time, mock_get_redis_client):
        """Test wait_if_needed returns 0 when request is allowed."""
        mock_time.return_value = 1000
        mock_redis = Mock()
        mock_redis.zremrangebyscore.return_value = None
        mock_redis.zcard.return_value = 5  # Under limit
        mock_redis.zadd.return_value = None
        mock_redis.expire.return_value = None
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        wait_time = limiter.wait_if_needed(
            user_id=123, max_requests=10, window_seconds=60
        )

        assert wait_time == 0.0
        mock_sleep.assert_not_called()

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    @patch("app.utils.rate_limiter.time.time")
    @patch("app.utils.rate_limiter.time.sleep")
    def test_wait_if_needed_with_wait(
        self, mock_sleep, mock_time, mock_get_redis_client
    ):
        """Test wait_if_needed calculates and waits when over limit."""
        mock_time.return_value = 1000
        mock_redis = Mock()
        # First call (is_allowed): over limit
        mock_redis.zremrangebyscore.return_value = None
        mock_redis.zcard.return_value = 10  # At limit
        # Second call: get oldest request
        oldest_request = [("request_key", 950)]  # 50 seconds ago
        mock_redis.zrange.return_value = oldest_request
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        wait_time = limiter.wait_if_needed(
            user_id=123, max_requests=10, window_seconds=60
        )

        # Wait time should be 60 - (1000 - 950) + 1 = 11 seconds
        assert wait_time == 11
        mock_sleep.assert_called_once_with(11)

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    @patch("app.utils.rate_limiter.time.time")
    def test_get_remaining_requests_success(self, mock_time, mock_get_redis_client):
        """Test get_remaining_requests returns correct count."""
        mock_time.return_value = 1000
        mock_redis = Mock()
        mock_redis.zremrangebyscore.return_value = None
        mock_redis.zcard.return_value = 3  # Current requests
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        remaining = limiter.get_remaining_requests(
            user_id=123, max_requests=10, window_seconds=60
        )

        assert remaining == 7  # 10 - 3
        mock_redis.zremrangebyscore.assert_called_once_with(
            "rate_limit:123:default", 0, 940
        )

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    def test_get_remaining_requests_exception(self, mock_get_redis_client):
        """Test get_remaining_requests handles exceptions."""
        mock_redis = Mock()
        mock_redis.zremrangebyscore.side_effect = Exception("Redis error")
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        remaining = limiter.get_remaining_requests(
            user_id=123, max_requests=10, window_seconds=60
        )

        # Should return max_requests on error
        assert remaining == 10

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    def test_reset_user_limit_success(self, mock_get_redis_client):
        """Test reset_user_limit deletes Redis key."""
        mock_redis = Mock()
        mock_redis.delete.return_value = 1
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        result = limiter.reset_user_limit(user_id=123, operation="api")

        assert result is True
        mock_redis.delete.assert_called_once_with("rate_limit:123:api")

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    def test_reset_user_limit_exception(self, mock_get_redis_client):
        """Test reset_user_limit handles exceptions."""
        mock_redis = Mock()
        mock_redis.delete.side_effect = Exception("Redis error")
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        result = limiter.reset_user_limit(user_id=123)

        assert result is False

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    @patch("app.utils.rate_limiter.time.time")
    def test_get_user_stats_success(self, mock_time, mock_get_redis_client):
        """Test get_user_stats returns correct statistics."""
        mock_time.return_value = 1000
        mock_redis = Mock()
        mock_redis.zremrangebyscore.return_value = None
        mock_redis.zcard.return_value = 5
        mock_redis.zrange.side_effect = [
            [("oldest", 950)],  # Oldest request
            [("newest", 990)],  # Newest request
        ]
        mock_redis.ttl.return_value = 300
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        stats = limiter.get_user_stats(user_id=123, operation="test")

        expected_stats = {
            "user_id": 123,
            "operation": "test",
            "current_requests": 5,
            "oldest_request_time": 950,
            "newest_request_time": 990,
            "key_expires_in": 300,
        }

        assert stats == expected_stats

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    def test_get_user_stats_exception(self, mock_get_redis_client):
        """Test get_user_stats handles exceptions."""
        mock_redis = Mock()
        mock_redis.zremrangebyscore.side_effect = Exception("Redis error")
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        stats = limiter.get_user_stats(user_id=123)

        expected_stats = {
            "user_id": 123,
            "operation": "default",
            "error": "Redis error",
        }

        assert stats == expected_stats


class TestGlobalRateLimiter:
    """Test cases for global rate limiter functions."""

    @patch("app.utils.rate_limiter._global_rate_limiter", None)
    @patch("app.utils.rate_limiter.RedisRateLimiter")
    def test_get_global_rate_limiter_creates_instance(self, mock_redis_rate_limiter):
        """Test get_global_rate_limiter creates new instance when None."""
        mock_limiter = Mock()
        mock_redis_rate_limiter.return_value = mock_limiter

        result = get_global_rate_limiter("custom_prefix")

        assert result == mock_limiter
        mock_redis_rate_limiter.assert_called_once_with("custom_prefix")

    def test_get_global_rate_limiter_returns_existing(self):
        """Test get_global_rate_limiter returns existing instance."""
        # Create a mock limiter and set it as the global instance
        existing_limiter = Mock()

        # Patch the global variable directly
        with patch("app.utils.rate_limiter._global_rate_limiter", existing_limiter):
            result = get_global_rate_limiter()
            assert result == existing_limiter


class TestRateLimiterIntegration:
    """Integration tests for rate limiter functionality."""

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    @patch("app.utils.rate_limiter.time.time")
    def test_rate_limiter_full_workflow(self, mock_time, mock_get_redis_client):
        """Test complete rate limiting workflow."""
        mock_time.return_value = 1000
        mock_redis = Mock()

        # Simulate requests progression: 0 -> 1 -> 2 -> ... -> limit
        request_counts = [0, 1, 2, 9, 10]  # Last one hits limit
        mock_redis.zcard.side_effect = request_counts
        mock_redis.zremrangebyscore.return_value = None
        mock_redis.zadd.return_value = None
        mock_redis.expire.return_value = None
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        # First 4 requests should be allowed
        for _ in range(4):
            result = limiter.is_allowed(user_id=1, max_requests=10, window_seconds=60)
            assert result is True

        # 5th request hits limit, should be denied
        result = limiter.is_allowed(user_id=1, max_requests=10, window_seconds=60)
        assert result is False

    @patch("app.utils.rate_limiter._global_redis_client", None)
    @patch("app.utils.rate_limiter.get_redis_client")
    @patch("app.utils.rate_limiter.time.time")
    def test_different_users_independent_limits(self, mock_time, mock_get_redis_client):
        """Test that different users have independent rate limits."""
        mock_time.return_value = 1000
        mock_redis = Mock()
        mock_redis.zremrangebyscore.return_value = None
        mock_redis.zcard.return_value = 0  # No existing requests
        mock_redis.zadd.return_value = None
        mock_redis.expire.return_value = None
        mock_get_redis_client.return_value = iter([mock_redis])

        limiter = RedisRateLimiter()

        # Both users should be allowed initially
        result1 = limiter.is_allowed(user_id=1, max_requests=1, window_seconds=60)
        result2 = limiter.is_allowed(user_id=2, max_requests=1, window_seconds=60)

        assert result1 is True
        assert result2 is True

        # Verify different keys were used
        expected_calls = [
            ("rate_limit:1:default", 0, 940),
            ("rate_limit:2:default", 0, 940),
        ]
        # Check that different keys were cleaned up
        assert len(mock_redis.zremrangebyscore.call_args_list) == 2
        for i, call in enumerate(mock_redis.zremrangebyscore.call_args_list):
            assert call[0] == expected_calls[i]
