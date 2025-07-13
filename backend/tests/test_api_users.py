from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


class TestUsersAPI:
    """Test cases for users API endpoints."""

    def test_register_user_success(self, client: TestClient):
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
        assert "password" not in data  # Password should not be returned

    def test_register_user_duplicate_username(self, client: TestClient):
        """Test user registration with duplicate username fails."""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }

        # Register first user
        response = client.post("/api/users/register", json=user_data)
        assert response.status_code == 201

        # Try to register second user with same username
        duplicate_data = {
            "username": "testuser",  # Same username
            "email": "test2@example.com",
            "password": "testpassword123",
            "nickname": "Test User 2",
        }

        response = client.post("/api/users/register", json=duplicate_data)
        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_register_user_duplicate_email(self, client: TestClient):
        """Test user registration with duplicate email fails."""
        user_data = {
            "username": "testuser1",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User 1",
        }

        # Register first user
        response = client.post("/api/users/register", json=user_data)
        assert response.status_code == 201

        # Try to register second user with same email
        duplicate_data = {
            "username": "testuser2",
            "email": "test@example.com",  # Same email
            "password": "testpassword123",
            "nickname": "Test User 2",
        }

        response = client.post("/api/users/register", json=duplicate_data)
        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_register_user_invalid_data(self, client: TestClient):
        """Test user registration with invalid data."""
        # Test missing required fields
        invalid_data = {
            "username": "testuser"
            # Missing email, password, nickname
        }

        response = client.post("/api/users/register", json=invalid_data)
        assert response.status_code == 422  # Validation error

    def test_login_success(self, client: TestClient):
        """Test successful user login."""
        # Register a user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        client.post("/api/users/register", json=user_data)

        # Login
        login_data = {"username": "testuser", "password": "testpassword123"}

        response = client.post("/api/users/login", data=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["username"] == "testuser"

    def test_login_wrong_password(self, client: TestClient):
        """Test login with wrong password."""
        # Register a user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        client.post("/api/users/register", json=user_data)

        # Try to login with wrong password
        login_data = {"username": "testuser", "password": "wrongpassword"}

        response = client.post("/api/users/login", data=login_data)

        assert response.status_code == 401
        data = response.json()
        assert "error" in data

    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user."""
        login_data = {"username": "nonexistent", "password": "testpassword123"}

        response = client.post("/api/users/login", data=login_data)

        assert response.status_code == 401
        data = response.json()
        assert "error" in data

    def test_get_current_user_success(self, client: TestClient):
        """Test getting current user with valid token."""
        # Register and login to get token
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        client.post("/api/users/register", json=user_data)

        login_data = {"username": "testuser", "password": "testpassword123"}
        login_response = client.post("/api/users/login", data=login_data)
        token = login_response.json()["access_token"]

        # Get current user
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/users/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert "password" not in data

    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/users/me", headers=headers)

        assert response.status_code == 401

    def test_get_current_user_no_token(self, client: TestClient):
        """Test getting current user without token."""
        response = client.get("/api/users/me")

        assert response.status_code == 401

    def test_update_user_success(self, client: TestClient):
        """Test updating user information."""
        # Register and login to get token
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        client.post("/api/users/register", json=user_data)

        login_data = {"username": "testuser", "password": "testpassword123"}
        login_response = client.post("/api/users/login", data=login_data)
        token = login_response.json()["access_token"]

        # Update user
        update_data = {"nickname": "Updated User", "email": "updated@example.com"}
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put("/api/users/me", json=update_data, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["nickname"] == "Updated User"
        assert data["email"] == "updated@example.com"
        assert data["username"] == "testuser"  # Should remain unchanged

    def test_change_password_success(self, client: TestClient):
        """Test changing user password."""
        # Register and login to get token
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        client.post("/api/users/register", json=user_data)

        login_data = {"username": "testuser", "password": "testpassword123"}
        login_response = client.post("/api/users/login", data=login_data)
        token = login_response.json()["access_token"]

        # Change password
        password_data = {
            "current_password": "testpassword123",
            "new_password": "newpassword123",
        }
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put(
            "/api/users/change-password", json=password_data, headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data

        # Try to login with new password
        new_login_data = {"username": "testuser", "password": "newpassword123"}
        new_login_response = client.post("/api/users/login", data=new_login_data)
        assert new_login_response.status_code == 200

    def test_change_password_wrong_current_password(self, client: TestClient):
        """Test changing password with wrong current password."""
        # Register and login to get token
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        client.post("/api/users/register", json=user_data)

        login_data = {"username": "testuser", "password": "testpassword123"}
        login_response = client.post("/api/users/login", data=login_data)
        token = login_response.json()["access_token"]

        # Try to change password with wrong current password
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
        }
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put(
            "/api/users/change-password", json=password_data, headers=headers
        )

        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_get_users_list(self, client: TestClient):
        """Test getting list of users."""
        # Register multiple users
        for i in range(3):
            user_data = {
                "username": f"testuser{i}",
                "email": f"test{i}@example.com",
                "password": "testpassword123",
                "nickname": f"Test User {i}",
            }
            client.post("/api/users/register", json=user_data)

        # Login as first user to get token
        login_data = {"username": "testuser0", "password": "testpassword123"}
        login_response = client.post("/api/users/login", data=login_data)
        token = login_response.json()["access_token"]

        # Get users list
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/users/", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3  # At least 3 users
        assert all("password" not in user for user in data)  # No passwords in response

    def test_get_user_by_id(self, client: TestClient):
        """Test getting user by ID."""
        # Register a user
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        register_response = client.post("/api/users/register", json=user_data)
        user_id = register_response.json()["id"]

        # Login to get token
        login_data = {"username": "testuser", "password": "testpassword123"}
        login_response = client.post("/api/users/login", data=login_data)
        token = login_response.json()["access_token"]

        # Get user by ID
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get(f"/api/users/{user_id}", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["username"] == "testuser"
        assert "password" not in data

    def test_get_nonexistent_user(self, client: TestClient):
        """Test getting non-existent user."""
        # Register and login to get token
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "nickname": "Test User",
        }
        client.post("/api/users/register", json=user_data)

        login_data = {"username": "testuser", "password": "testpassword123"}
        login_response = client.post("/api/users/login", data=login_data)
        token = login_response.json()["access_token"]

        # Try to get non-existent user
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/users/999", headers=headers)

        assert response.status_code == 404
