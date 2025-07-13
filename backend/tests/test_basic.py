import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "AlgoAssistant API"


def test_root_endpoint(client: TestClient):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "AlgoAssistant API" in data["message"]


def test_api_structure(client: TestClient):
    """Test that API endpoints are properly configured."""
    # Test that users endpoint exists (should return 401 for unauthorized access)
    response = client.get("/api/users/")
    assert response.status_code == 401  # Unauthorized, but endpoint exists

    # Test that records endpoint exists
    response = client.get("/api/records/")
    assert response.status_code == 401  # Unauthorized, but endpoint exists
