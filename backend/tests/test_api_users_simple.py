"""Simplified tests for users API endpoints."""

from fastapi.testclient import TestClient


class TestUsersAPISimple:
    """Simplified test cases for users API endpoints."""

    def test_register_user_success(self, client: TestClient, db_engine):
        """Test successful user registration."""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }

        response = client.post("/api/users/register", json=user_data)

        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert data["nickname"] == "Test User"
        assert "id" in data
        assert "password_hash" not in data  # Password should not be returned

    def test_register_user_invalid_data(self, client: TestClient):
        """Test user registration with invalid data."""
        user_data = {
            "username": "",  # Invalid: empty username
            "email": "invalid-email",  # Invalid: bad email format
            "password": "123",  # Invalid: too short
        }

        response = client.post("/api/users/register", json=user_data)

        assert response.status_code == 422  # Validation error

    def test_get_current_user_no_token(self, client: TestClient):
        """Test getting current user without token fails."""
        response = client.get("/api/users/me")

        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token fails."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/users/me", headers=headers)

        assert response.status_code == 401
