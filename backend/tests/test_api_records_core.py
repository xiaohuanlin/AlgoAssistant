"""Core tests for records API endpoints."""

from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient

from app import models, schemas


class TestRecordsAPI:
    """Test cases for records API endpoints."""

    def test_create_record_success(self, client: TestClient, db_engine):
        """Test creating a record successfully."""
        # Create a test user first
        user_data = {
            "username": "recorduser",
            "email": "record@example.com",
            "password": "testpass123",
            "nickname": "Record User",
        }

        # Register user
        register_response = client.post("/api/users/register", json=user_data)
        assert register_response.status_code == 201
        user = register_response.json()

        # Login to get token
        login_response = client.post(
            "/api/users/login",
            data={"username": "recorduser", "password": "testpass123"},
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Create record
        record_data = {
            "problem_id": 1,
            "problem_title": "Two Sum",
            "solution_code": "def two_sum(nums, target): return [0, 1]",
            "execution_result": "Accepted",
            "language": "python",
            "oj_type": "leetcode",
        }

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/records/", json=record_data, headers=headers)

        assert response.status_code == 201
        data = response.json()
        assert data["problem_id"] == 1
        assert data["problem_title"] == "Two Sum"
        assert data["execution_result"] == "Accepted"
        assert data["language"] == "python"
        assert "id" in data
        assert "created_at" in data

    def test_create_record_unauthorized(self, client: TestClient):
        """Test creating a record without authentication fails."""
        record_data = {
            "problem_id": 1,
            "problem_title": "Two Sum",
            "solution_code": "def two_sum(): pass",
            "execution_result": "Accepted",
            "language": "python",
        }

        response = client.post("/api/records/", json=record_data)
        assert response.status_code == 401

    def test_create_record_invalid_data(self, client: TestClient, db_engine):
        """Test creating a record with invalid data."""
        # Create and login user
        user_data = {
            "username": "testuser2",
            "email": "test2@example.com",
            "password": "testpass123",
            "nickname": "Test User 2",
        }

        client.post("/api/users/register", json=user_data)
        login_response = client.post(
            "/api/users/login",
            data={"username": "testuser2", "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Try to create record with missing required fields
        invalid_record_data = {
            "problem_title": "Two Sum",
            # Missing problem_id, solution_code, etc.
        }

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post(
            "/api/records/", json=invalid_record_data, headers=headers
        )

        assert response.status_code == 422  # Validation error

    def test_get_records_list_empty(self, client: TestClient, db_engine):
        """Test getting records list when user has no records."""
        # Create and login user
        user_data = {
            "username": "emptyuser",
            "email": "empty@example.com",
            "password": "testpass123",
            "nickname": "Empty User",
        }

        client.post("/api/users/register", json=user_data)
        login_response = client.post(
            "/api/users/login",
            data={"username": "emptyuser", "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/records/", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []

    def test_get_records_list_with_pagination(self, client: TestClient, db_engine):
        """Test getting records list with pagination parameters."""
        # Create and login user
        user_data = {
            "username": "paginationuser",
            "email": "pagination@example.com",
            "password": "testpass123",
            "nickname": "Pagination User",
        }

        client.post("/api/users/register", json=user_data)
        login_response = client.post(
            "/api/users/login",
            data={"username": "paginationuser", "password": "testpass123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create multiple records
        for i in range(5):
            record_data = {
                "problem_id": i + 1,
                "problem_title": f"Problem {i + 1}",
                "solution_code": "def solution(): pass",
                "execution_result": "Accepted",
                "language": "python",
            }
            client.post("/api/records/", json=record_data, headers=headers)

        # Test pagination
        response = client.get("/api/records/?page=1&size=3", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 5
        assert len(data["items"]) == 3

    def test_get_record_stats(self, client: TestClient, db_engine):
        """Test getting record statistics."""
        # Create and login user
        user_data = {
            "username": "statsuser",
            "email": "stats@example.com",
            "password": "testpass123",
            "nickname": "Stats User",
        }

        client.post("/api/users/register", json=user_data)
        login_response = client.post(
            "/api/users/login",
            data={"username": "statsuser", "password": "testpass123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create some records
        for i, result in enumerate(["Accepted", "Wrong Answer", "Accepted"]):
            record_data = {
                "problem_id": i + 1,
                "problem_title": f"Problem {i + 1}",
                "solution_code": "def solution(): pass",
                "execution_result": result,
                "language": "python",
            }
            client.post("/api/records/", json=record_data, headers=headers)

        # Get stats
        response = client.get("/api/records/stats", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "total_records" in data
        assert "languages" in data
        assert "execution_results" in data
        assert data["total_records"] == 3

    def test_get_single_record_success(self, client: TestClient, db_engine):
        """Test getting a single record successfully."""
        # Create user, login, and create record
        user_data = {
            "username": "singleuser",
            "email": "single@example.com",
            "password": "testpass123",
            "nickname": "Single User",
        }

        client.post("/api/users/register", json=user_data)
        login_response = client.post(
            "/api/users/login",
            data={"username": "singleuser", "password": "testpass123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a record
        record_data = {
            "problem_id": 42,
            "problem_title": "Test Problem",
            "solution_code": "def solution(): return 42",
            "execution_result": "Accepted",
            "language": "python",
        }
        create_response = client.post(
            "/api/records/", json=record_data, headers=headers
        )
        record_id = create_response.json()["id"]

        # Get the record
        response = client.get(f"/api/records/{record_id}", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == record_id
        assert data["problem_id"] == 42
        assert data["problem_title"] == "Test Problem"

    def test_get_single_record_not_found(self, client: TestClient, db_engine):
        """Test getting a nonexistent record returns 404."""
        # Create and login user
        user_data = {
            "username": "notfounduser",
            "email": "notfound@example.com",
            "password": "testpass123",
            "nickname": "Not Found User",
        }

        client.post("/api/users/register", json=user_data)
        login_response = client.post(
            "/api/users/login",
            data={"username": "notfounduser", "password": "testpass123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Try to get non-existent record
        response = client.get("/api/records/999999", headers=headers)

        assert response.status_code == 404

    def test_update_record_success(self, client: TestClient, db_engine):
        """Test updating a record successfully."""
        # Create user, login, and create record
        user_data = {
            "username": "updateuser",
            "email": "update@example.com",
            "password": "testpass123",
            "nickname": "Update User",
        }

        client.post("/api/users/register", json=user_data)
        login_response = client.post(
            "/api/users/login",
            data={"username": "updateuser", "password": "testpass123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a record
        record_data = {
            "problem_id": 100,
            "problem_title": "Original Title",
            "solution_code": "original code",
            "execution_result": "Wrong Answer",
            "language": "python",
        }
        create_response = client.post(
            "/api/records/", json=record_data, headers=headers
        )
        record_id = create_response.json()["id"]

        # Update the record
        update_data = {
            "problem_title": "Updated Title",
            "solution_code": "updated code",
            "execution_result": "Accepted",
        }
        response = client.put(
            f"/api/records/{record_id}", json=update_data, headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["problem_title"] == "Updated Title"
        assert data["solution_code"] == "updated code"
        assert data["execution_result"] == "Accepted"

    def test_delete_record_success(self, client: TestClient, db_engine):
        """Test deleting a record successfully."""
        # Create user, login, and create record
        user_data = {
            "username": "deleteuser",
            "email": "delete@example.com",
            "password": "testpass123",
            "nickname": "Delete User",
        }

        client.post("/api/users/register", json=user_data)
        login_response = client.post(
            "/api/users/login",
            data={"username": "deleteuser", "password": "testpass123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a record
        record_data = {
            "problem_id": 200,
            "problem_title": "To Delete",
            "solution_code": "def solution(): pass",
            "execution_result": "Accepted",
            "language": "python",
        }
        create_response = client.post(
            "/api/records/", json=record_data, headers=headers
        )
        record_id = create_response.json()["id"]

        # Delete the record
        response = client.delete(f"/api/records/{record_id}", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Record deleted successfully"

        # Verify record is gone
        get_response = client.get(f"/api/records/{record_id}", headers=headers)
        assert get_response.status_code == 404
