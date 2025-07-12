"""
Redis-based rate limiter for controlling API request frequency per user
"""

import time
import redis
from typing import Optional, Dict, Any
from app.utils.logger import get_logger

logger = get_logger(__name__)

class RedisRateLimiter:
    """Redis-based rate limiter for controlling request frequency"""
    
    def __init__(self, redis_client: redis.Redis, prefix: str = "rate_limit"):
        self.redis_client = redis_client
        self.prefix = prefix
    
    def _get_key(self, user_id: int, operation: str = "default") -> str:
        """Generate Redis key for rate limiting"""
        return f"{self.prefix}:{user_id}:{operation}"
    
    def is_allowed(self, user_id: int, max_requests: int, window_seconds: int, operation: str = "default") -> bool:
        """
        Check if request is allowed based on rate limit
        
        Args:
            user_id: User ID
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            operation: Operation type (e.g., 'graphql', 'api')
            
        Returns:
            True if request is allowed, False otherwise
        """
        key = self._get_key(user_id, operation)
        current_time = int(time.time())
        window_start = current_time - window_seconds
        
        try:
            # Remove old entries outside the window
            self.redis_client.zremrangebyscore(key, 0, window_start)
            
            # Count current requests in window
            current_requests = self.redis_client.zcard(key)
            
            if current_requests >= max_requests:
                logger.debug(f"Rate limit exceeded for user {user_id}, operation {operation}: {current_requests}/{max_requests}")
                return False
            
            # Add current request timestamp
            self.redis_client.zadd(key, {str(current_time): current_time})
            
            # Set expiration for the key
            self.redis_client.expire(key, window_seconds + 60)  # Add 60 seconds buffer
            
            logger.debug(f"Rate limit check passed for user {user_id}, operation {operation}: {current_requests + 1}/{max_requests}")
            return True
            
        except Exception as e:
            logger.error(f"Error checking rate limit for user {user_id}: {e}")
            # On error, allow the request to avoid blocking
            return True
    
    def wait_if_needed(self, user_id: int, max_requests: int, window_seconds: int, operation: str = "default") -> float:
        """
        Wait if rate limit is exceeded and return wait time
        
        Args:
            user_id: User ID
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            operation: Operation type
            
        Returns:
            Wait time in seconds (0 if no wait needed)
        """
        if self.is_allowed(user_id, max_requests, window_seconds, operation):
            return 0.0
        
        # Calculate wait time
        key = self._get_key(user_id, operation)
        try:
            # Get the oldest request in the window
            oldest_request = self.redis_client.zrange(key, 0, 0, withscores=True)
            if oldest_request:
                oldest_time = int(oldest_request[0][1])
                wait_time = window_seconds - (int(time.time()) - oldest_time) + 1
                wait_time = max(0, wait_time)
                
                logger.info(f"Rate limit exceeded for user {user_id}, operation {operation}. Waiting {wait_time} seconds")
                time.sleep(wait_time)
                return wait_time
        except Exception as e:
            logger.error(f"Error calculating wait time for user {user_id}: {e}")
        
        return 0.0
    
    def get_remaining_requests(self, user_id: int, max_requests: int, window_seconds: int, operation: str = "default") -> int:
        """
        Get remaining requests for user
        
        Args:
            user_id: User ID
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            operation: Operation type
            
        Returns:
            Number of remaining requests
        """
        key = self._get_key(user_id, operation)
        current_time = int(time.time())
        window_start = current_time - window_seconds
        
        try:
            # Remove old entries outside the window
            self.redis_client.zremrangebyscore(key, 0, window_start)
            
            # Count current requests in window
            current_requests = self.redis_client.zcard(key)
            
            return max(0, max_requests - current_requests)
            
        except Exception as e:
            logger.error(f"Error getting remaining requests for user {user_id}: {e}")
            return max_requests
    
    def reset_user_limit(self, user_id: int, operation: str = "default") -> bool:
        """
        Reset rate limit for a user
        
        Args:
            user_id: User ID
            operation: Operation type
            
        Returns:
            True if reset successful
        """
        key = self._get_key(user_id, operation)
        try:
            self.redis_client.delete(key)
            logger.info(f"Reset rate limit for user {user_id}, operation {operation}")
            return True
        except Exception as e:
            logger.error(f"Error resetting rate limit for user {user_id}: {e}")
            return False
    
    def get_user_stats(self, user_id: int, operation: str = "default") -> Dict[str, Any]:
        """
        Get rate limit statistics for a user
        
        Args:
            user_id: User ID
            operation: Operation type
            
        Returns:
            Dictionary with rate limit statistics
        """
        key = self._get_key(user_id, operation)
        try:
            current_time = int(time.time())
            window_start = current_time - 3600  # Last hour
            
            # Remove old entries
            self.redis_client.zremrangebyscore(key, 0, window_start)
            
            # Get current requests
            current_requests = self.redis_client.zcard(key)
            
            # Get oldest and newest request times
            oldest_request = self.redis_client.zrange(key, 0, 0, withscores=True)
            newest_request = self.redis_client.zrange(key, -1, -1, withscores=True)
            
            stats = {
                "user_id": user_id,
                "operation": operation,
                "current_requests": current_requests,
                "oldest_request_time": int(oldest_request[0][1]) if oldest_request else None,
                "newest_request_time": int(newest_request[0][1]) if newest_request else None,
                "key_expires_in": self.redis_client.ttl(key)
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting stats for user {user_id}: {e}")
            return {"user_id": user_id, "operation": operation, "error": str(e)}

# Global rate limiter instance
_global_rate_limiter: Optional[RedisRateLimiter] = None

def get_global_rate_limiter(redis_client: redis.Redis) -> RedisRateLimiter:
    """Get global rate limiter instance"""
    global _global_rate_limiter
    if _global_rate_limiter is None:
        _global_rate_limiter = RedisRateLimiter(redis_client, "leetcode_rate_limit")
    return _global_rate_limiter 