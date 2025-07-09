import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.user_service import UserService
from app.schemas import UserCreate

class TestUsersAPI:
    """Test users API endpoints."""
    
    def test_register_user_success(self, client, test_user_data):
        """Test successful user registration."""
        response = client.post("/api/register", json=test_user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user_data["username"]
        assert data["email"] == test_user_data["email"]
        assert data["nickname"] == test_user_data["nickname"]
        assert "password" not in data  # Password should not be returned
        assert "id" in data
        assert "created_at" in data
    
    def test_register_user_duplicate_username(self, client, test_user_data):
        """Test registration with duplicate username."""
        # Register first user
        response1 = client.post("/api/register", json=test_user_data)
        assert response1.status_code == 200
        
        # Try to register second user with same username
        test_user_data["email"] = "different@example.com"
        response2 = client.post("/api/register", json=test_user_data)
        
        assert response2.status_code == 400
        assert "Username already registered" in response2.json()["detail"]
    
    def test_register_user_duplicate_email(self, client, test_user_data):
        """Test registration with duplicate email."""
        # Register first user
        response1 = client.post("/api/register", json=test_user_data)
        assert response1.status_code == 200
        
        # Try to register second user with same email
        test_user_data["username"] = "differentuser"
        response2 = client.post("/api/register", json=test_user_data)
        
        assert response2.status_code == 400
        assert "Email already registered" in response2.json()["detail"]
    
    def test_register_user_invalid_email(self, client, test_user_data):
        """Test registration with invalid email format."""
        test_user_data["email"] = "invalid-email"
        response = client.post("/api/register", json=test_user_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_register_user_missing_fields(self, client):
        """Test registration with missing required fields."""
        incomplete_data = {"username": "testuser"}
        response = client.post("/api/register", json=incomplete_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_login_success(self, client, test_user_data):
        """Test successful user login."""
        # Register user first
        register_response = client.post("/api/register", json=test_user_data)
        assert register_response.status_code == 200
        
        # Login
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        login_response = client.post("/api/login", json=login_data)
        
        assert login_response.status_code == 200
        data = login_response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
    
    def test_login_invalid_username(self, client, test_user_data):
        """Test login with invalid username."""
        # Register user first
        register_response = client.post("/api/register", json=test_user_data)
        assert register_response.status_code == 200
        
        # Try to login with wrong username
        login_data = {
            "username": "wronguser",
            "password": test_user_data["password"]
        }
        login_response = client.post("/api/login", json=login_data)
        
        assert login_response.status_code == 400
        assert "Incorrect username or password" in login_response.json()["detail"]
    
    def test_login_invalid_password(self, client, test_user_data):
        """Test login with invalid password."""
        # Register user first
        register_response = client.post("/api/register", json=test_user_data)
        assert register_response.status_code == 200
        
        # Try to login with wrong password
        login_data = {
            "username": test_user_data["username"],
            "password": "wrongpassword"
        }
        login_response = client.post("/api/login", json=login_data)
        
        assert login_response.status_code == 400
        assert "Incorrect username or password" in login_response.json()["detail"]
    
    def test_get_current_user_with_token(self, client, test_user_data):
        """Test getting current user with valid token."""
        # Register and login user
        register_response = client.post("/api/register", json=test_user_data)
        assert register_response.status_code == 200
        
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        login_response = client.post("/api/login", json=login_data)
        assert login_response.status_code == 200
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get current user
        me_response = client.get("/api/me", headers=headers)
        
        assert me_response.status_code == 200
        data = me_response.json()
        assert data["username"] == test_user_data["username"]
        assert data["email"] == test_user_data["email"]
        assert "password" not in data
    
    def test_get_current_user_without_token(self, client):
        """Test getting current user without token."""
        response = client.get("/api/me")
        
        assert response.status_code == 401  # Unauthorized
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/me", headers=headers)
        
        assert response.status_code == 401  # Unauthorized
    
    def test_create_user_config(self, client, test_user_data):
        """Test creating user configuration."""
        # Register and login user
        register_response = client.post("/api/register", json=test_user_data)
        assert register_response.status_code == 200
        
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        login_response = client.post("/api/login", json=login_data)
        assert login_response.status_code == 200
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create user config
        config_data = {
            "leetcode_name": "leetcode_user",
            "github_repo": "user/repo",
            "notion_token": "notion_token_123",
            "notion_db_id": "db_123",
            "openai_key": "openai_key_123"
        }
        
        config_response = client.post("/api/config", json=config_data, headers=headers)
        
        assert config_response.status_code == 200
        data = config_response.json()
        assert data["leetcode_name"] == "leetcode_user"
        assert data["github_repo"] == "user/repo"
        assert data["notion_db_id"] == "db_123"
        # Sensitive data should not be returned
        assert "notion_token" not in data
        assert "openai_key" not in data
    
    def test_get_user_config(self, client, test_user_data):
        """Test getting user configuration."""
        # Register and login user
        register_response = client.post("/api/register", json=test_user_data)
        assert register_response.status_code == 200
        
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        login_response = client.post("/api/login", json=login_data)
        assert login_response.status_code == 200
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create user config first
        config_data = {
            "leetcode_name": "leetcode_user",
            "github_repo": "user/repo"
        }
        client.post("/api/config", json=config_data, headers=headers)
        
        # Get user config
        config_response = client.get("/api/config", headers=headers)
        
        assert config_response.status_code == 200
        data = config_response.json()
        assert data["leetcode_name"] == "leetcode_user"
        assert data["github_repo"] == "user/repo" 