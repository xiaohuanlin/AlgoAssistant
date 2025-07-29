"""
Test configuration and fixtures for the API tests.
"""
import os
import sys
from pathlib import Path

import pytest

# Add the backend app to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Test configuration
TEST_CONFIG = {
    "BASE_URL": "http://localhost:8000",
    "TEST_USER": {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "nickname": "Test User",
    },
}


@pytest.fixture
def base_url():
    """Base URL for API testing."""
    return TEST_CONFIG["BASE_URL"]


@pytest.fixture
def test_user():
    """Test user data."""
    return TEST_CONFIG["TEST_USER"]
