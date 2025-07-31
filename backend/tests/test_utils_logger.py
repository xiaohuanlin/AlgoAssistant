"""Tests for logger utility."""

import logging
from unittest.mock import Mock, patch

import pytest

from app.utils.logger import LineNumberFormatter, get_logger, setup_logger


class TestLineNumberFormatter:
    """Test cases for LineNumberFormatter."""

    def test_line_number_formatter_basic(self):
        """Test basic functionality of LineNumberFormatter."""
        formatter = LineNumberFormatter("%(filename)s:%(lineno)d - %(message)s")

        # Create a mock record
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="/path/to/test.py",
            lineno=42,
            msg="Test message",
            args=(),
            exc_info=None,
        )

        # Format the record
        formatted = formatter.format(record)

        # Should contain filename and line number
        assert "test.py" in formatted or "42" in formatted
        assert "Test message" in formatted

    @patch("inspect.currentframe")
    def test_line_number_formatter_no_frame(self, mock_currentframe):
        """Test formatter when no frame is available."""
        mock_currentframe.return_value = None
        formatter = LineNumberFormatter("%(message)s")

        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="/path/to/test.py",
            lineno=42,
            msg="Test message",
            args=(),
            exc_info=None,
        )

        formatted = formatter.format(record)
        assert "Test message" in formatted


class TestSetupLogger:
    """Test cases for setup_logger function."""

    def test_setup_logger_with_name(self):
        """Test setting up logger with specific name."""
        logger = setup_logger("test_logger", level=logging.DEBUG)

        assert logger.name == "test_logger"
        assert logger.level == logging.DEBUG
        assert len(logger.handlers) == 1
        assert isinstance(logger.handlers[0], logging.StreamHandler)
        assert not logger.propagate

    def test_setup_logger_no_duplicate_handlers(self):
        """Test that setting up the same logger doesn't add duplicate handlers."""
        logger1 = setup_logger("duplicate_test")
        handler_count_1 = len(logger1.handlers)

        logger2 = setup_logger("duplicate_test")
        handler_count_2 = len(logger2.handlers)

        assert logger1 is logger2  # Same logger instance
        assert handler_count_1 == handler_count_2  # No additional handlers

    @patch("inspect.currentframe")
    def test_setup_logger_auto_name(self, mock_currentframe):
        """Test automatic name detection from calling frame."""
        # Mock frame stack
        mock_frame = Mock()
        mock_frame.f_code.co_name = "test_function"
        mock_frame.f_code.co_filename = "/path/to/test.py"
        mock_frame.f_back = None

        mock_currentframe.return_value = mock_frame

        logger = setup_logger()

        # Should use the function name from the frame
        assert logger.name == "test_function"

    @patch("inspect.currentframe")
    def test_setup_logger_no_frame(self, mock_currentframe):
        """Test setup_logger when no frame is available."""
        mock_currentframe.return_value = None

        logger = setup_logger()

        # Should still create a logger (with None name)
        assert logger is not None
        assert isinstance(logger, logging.Logger)


class TestGetLogger:
    """Test cases for get_logger function."""

    def test_get_logger_with_name(self):
        """Test getting logger with specific name."""
        logger = get_logger("test_get_logger")

        assert logger.name == "test_get_logger"
        assert isinstance(logger, logging.Logger)

    def test_get_logger_returns_same_instance(self):
        """Test that get_logger returns the same instance for same name."""
        logger1 = get_logger("same_name")
        logger2 = get_logger("same_name")

        assert logger1 is logger2

    @patch("app.utils.logger.setup_logger")
    def test_get_logger_calls_setup_logger(self, mock_setup_logger):
        """Test that get_logger calls setup_logger."""
        mock_logger = Mock()
        mock_setup_logger.return_value = mock_logger

        result = get_logger("test_name")

        mock_setup_logger.assert_called_once_with("test_name")
        assert result == mock_logger


class TestLoggerIntegration:
    """Integration tests for logger functionality."""

    def test_logger_logging_levels(self):
        """Test that logger respects different logging levels."""
        logger = setup_logger("level_test", level=logging.WARNING)

        # Mock handler to capture log records
        mock_handler = Mock()
        logger.handlers = [mock_handler]

        # Log at different levels
        logger.debug("Debug message")  # Should not be logged
        logger.info("Info message")  # Should not be logged
        logger.warning("Warning message")  # Should be logged
        logger.error("Error message")  # Should be logged

        # Only warning and error should have been logged
        assert mock_handler.handle.call_count == 2

    def test_logger_formatter_integration(self):
        """Test that logger uses the custom formatter."""
        logger = setup_logger("formatter_test")

        # Check that handler has LineNumberFormatter
        handler = logger.handlers[0]
        assert isinstance(handler.formatter, LineNumberFormatter)

        # Check formatter format string
        expected_format = "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
        assert handler.formatter._fmt == expected_format
