import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.models import User, UserConfig
from app.deps import get_current_user, get_db

client = TestClient(app)

class TestGitHubAPI:
    """Test GitHub API endpoints."""
    
    def test_github_oauth_url(self, db_session):
        """Test getting GitHub OAuth URL."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Create user config
        user_config = UserConfig(user_id=user.id)
        db_session.add(user_config)
        db_session.commit()
        
        # Override the dependencies for this test
        def override_get_current_user():
            return user
        
        def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            with patch('app.api.github.GitHubOAuthService') as mock_oauth:
                mock_oauth.return_value.get_authorization_url.return_value = "https://github.com/auth"
                
                response = client.get("/api/github/auth")
                
                assert response.status_code == 200
                assert "auth_url" in response.json()
        finally:
            app.dependency_overrides.clear()
    
    def test_github_oauth_callback_success(self, db_session):
        """Test successful GitHub OAuth callback."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Override the database dependency
        def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            with patch('app.api.github.GitHubOAuthService') as mock_oauth:
                mock_service = MagicMock()
                mock_service.exchange_code_for_token.return_value = {"access_token": "test_token"}
                mock_service.get_user_info.return_value = {"login": "testuser"}
                mock_service.encrypt_token.return_value = "encrypted_token"
                mock_oauth.return_value = mock_service
                
                response = client.get("/api/github/callback?code=test_code&state=1")
                
                assert response.status_code == 200
                assert response.json()["success"] is True
        finally:
            app.dependency_overrides.clear()
    
    def test_github_oauth_callback_no_code(self, db_session):
        """Test GitHub OAuth callback without code."""
        response = client.get("/api/github/callback?state=1")
        
        assert response.status_code == 422  # Validation error
    
    def test_push_record_to_github_success(self, db_session):
        """Test successful record push to GitHub."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Create user config with GitHub token
        user_config = UserConfig(
            user_id=user.id,
            github_token="encrypted_token",
            github_repo="user/repo"
        )
        db_session.add(user_config)
        db_session.commit()
        
        # Override the dependencies for this test
        def override_get_current_user():
            return user
        
        def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            with patch('app.api.github.RecordService') as mock_record_service:
                mock_service = MagicMock()
                mock_service.get_record.return_value = MagicMock()
                mock_service.push_record_to_github.return_value = "https://github.com/commit/123"
                mock_record_service.return_value = mock_service
                
                response = client.post("/api/github/push/1")
                
                assert response.status_code == 200
                assert "github_url" in response.json()
        finally:
            app.dependency_overrides.clear()
    
    def test_push_record_to_github_unauthorized(self, db_session):
        """Test record push to GitHub without authentication."""
        response = client.post("/api/github/push/1")
        
        assert response.status_code == 401
    
    def test_get_github_status_connected(self, db_session):
        """Test getting GitHub connection status when connected."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Create user config with GitHub token
        user_config = UserConfig(
            user_id=user.id,
            github_token="encrypted_token",
            github_repo="user/repo"
        )
        db_session.add(user_config)
        db_session.commit()
        
        # Override the dependencies for this test
        def override_get_current_user():
            return user
        
        def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            with patch('app.api.github.GitHubOAuthService') as mock_oauth:
                mock_service = MagicMock()
                mock_service.decrypt_token.return_value = "decrypted_token"
                mock_service.validate_token.return_value = True
                mock_service.get_user_info.return_value = {"login": "testuser"}
                mock_oauth.return_value = mock_service
                
                response = client.get("/api/github/status")
                
                assert response.status_code == 200
                assert response.json()["connected"] is True
        finally:
            app.dependency_overrides.clear() 