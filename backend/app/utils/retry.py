"""
Retry utility for handling transient failures with exponential backoff
"""

import time
import random
import functools
from typing import Callable, Any, Optional, Type, Union, Tuple
from app.utils.logger import get_logger

logger = get_logger(__name__)

class RetryConfig:
    """Configuration for retry behavior"""
    
    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        retry_exceptions: Union[Type[Exception], Tuple[Type[Exception], ...]] = Exception,
        on_retry: Optional[Callable[[int, Exception, float], None]] = None
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retry_exceptions = retry_exceptions
        self.on_retry = on_retry

def retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retry_exceptions: Union[Type[Exception], Tuple[Type[Exception], ...]] = Exception,
    on_retry: Optional[Callable[[int, Exception, float], None]] = None
):
    """
    Decorator for retrying functions with exponential backoff
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Base delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Base for exponential backoff calculation
        jitter: Whether to add random jitter to delays
        retry_exceptions: Exception types to retry on
        on_retry: Callback function called before each retry
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retry_exceptions as e:
                    last_exception = e
                    
                    if attempt == max_retries:
                        logger.error(f"Function {func.__name__} failed after {max_retries + 1} attempts. Last error: {e}")
                        raise
                    
                    # Calculate delay with exponential backoff
                    delay = min(
                        base_delay * (exponential_base ** attempt),
                        max_delay
                    )
                    
                    # Add jitter if enabled
                    if jitter:
                        delay = delay * (0.5 + random.random() * 0.5)
                    
                    logger.warning(
                        f"Function {func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}): {e}. "
                        f"Retrying in {delay:.2f} seconds..."
                    )
                    
                    # Call on_retry callback if provided
                    if on_retry:
                        try:
                            on_retry(attempt + 1, e, delay)
                        except Exception as callback_error:
                            logger.error(f"Error in retry callback: {callback_error}")
                    
                    time.sleep(delay)
            
            # This should never be reached, but just in case
            raise last_exception
        
        return wrapper
    return decorator

class RetryableOperation:
    """Class for retryable operations with more control"""
    
    def __init__(self, config: RetryConfig):
        self.config = config
    
    def execute(self, operation: Callable[[], Any], *args, **kwargs) -> Any:
        """
        Execute an operation with retry logic
        
        Args:
            operation: Function to execute
            *args, **kwargs: Arguments to pass to the operation
            
        Returns:
            Result of the operation
            
        Raises:
            Last exception if all retries fail
        """
        last_exception = None
        
        for attempt in range(self.config.max_retries + 1):
            try:
                return operation(*args, **kwargs)
            except self.config.retry_exceptions as e:
                last_exception = e
                
                if attempt == self.config.max_retries:
                    logger.error(f"Operation failed after {self.config.max_retries + 1} attempts. Last error: {e}")
                    raise
                
                # Calculate delay with exponential backoff
                delay = min(
                    self.config.base_delay * (self.config.exponential_base ** attempt),
                    self.config.max_delay
                )
                
                # Add jitter if enabled
                if self.config.jitter:
                    delay = delay * (0.5 + random.random() * 0.5)
                
                logger.warning(
                    f"Operation failed (attempt {attempt + 1}/{self.config.max_retries + 1}): {e}. "
                    f"Retrying in {delay:.2f} seconds..."
                )
                
                # Call on_retry callback if provided
                if self.config.on_retry:
                    try:
                        self.config.on_retry(attempt + 1, e, delay)
                    except Exception as callback_error:
                        logger.error(f"Error in retry callback: {callback_error}")
                
                time.sleep(delay)
        
        # This should never be reached, but just in case
        raise last_exception

# Predefined retry configurations
HTTP_RETRY_CONFIG = RetryConfig(
    max_retries=3,
    base_delay=1.0,
    max_delay=30.0,
    exponential_base=2.0,
    jitter=True,
    retry_exceptions=(ConnectionError, TimeoutError, OSError)
)

GRAPHQL_RETRY_CONFIG = RetryConfig(
    max_retries=3,
    base_delay=2.0,
    max_delay=60.0,
    exponential_base=2.0,
    jitter=True,
    retry_exceptions=Exception
)

DATABASE_RETRY_CONFIG = RetryConfig(
    max_retries=3,
    base_delay=0.5,
    max_delay=10.0,
    exponential_base=2.0,
    jitter=True,
    retry_exceptions=(ConnectionError, TimeoutError)
) 