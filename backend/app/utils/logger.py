"""
Global Logger utility module
Provides unified logging functionality with line number display
"""

import inspect
import logging
import sys
from typing import Optional


class LineNumberFormatter(logging.Formatter):
    """Custom formatter that displays calling line numbers in logs"""

    def format(self, record):
        # Get calling frame
        caller_frame = inspect.currentframe()
        if caller_frame is None:
            return super().format(record)
        caller_frame = caller_frame.f_back
        while caller_frame:
            # Skip logger-related frames
            if (
                caller_frame.f_code.co_filename.endswith("logger.py")
                or "logging" in caller_frame.f_code.co_filename
            ):
                caller_frame = caller_frame.f_back
                continue

            # Find the actual calling location
            record.lineno = caller_frame.f_lineno
            record.filename = caller_frame.f_code.co_filename.split("/")[
                -1
            ]  # Show only filename
            break

        return super().format(record)


def setup_logger(
    name: Optional[str] = None, level: int = logging.INFO
) -> logging.Logger:
    """
    Set up and return a configured logger

    Args:
        name: logger name, if None uses the calling module's name
        level: log level

    Returns:
        Configured logger instance
    """
    if name is None:
        # Get calling module name
        caller_frame = inspect.currentframe()
        if caller_frame is None:
            return logging.getLogger(name)
        caller_frame = caller_frame.f_back
        while caller_frame:
            if (
                caller_frame.f_code.co_filename.endswith("logger.py")
                or "logging" in caller_frame.f_code.co_filename
            ):
                caller_frame = caller_frame.f_back
                continue
            name = caller_frame.f_code.co_name
            break

    logger = logging.getLogger(name)

    # Avoid adding duplicate handlers
    if not logger.handlers:
        # Create console handler
        console_handler = logging.StreamHandler(sys.stdout)

        # Set formatter
        formatter = LineNumberFormatter(
            "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
        )
        console_handler.setFormatter(formatter)

        # Add handler and set level
        logger.addHandler(console_handler)
        logger.setLevel(level)

        # Prevent log propagation
        logger.propagate = False

    return logger


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Convenient method to get logger instance

    Args:
        name: logger name, if None uses the calling module's name

    Returns:
        logger instance
    """
    return setup_logger(name)


# Create default global logger
default_logger = setup_logger("AlgoAssistant")
