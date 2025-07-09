import pytest
from unittest.mock import patch, MagicMock
from app.services.github_oauth_service import GitHubOAuthService

class TestGitHubOAuthService:
    """Test GitHubOAuthService functionality."""
    
    def test_get_authorization_url(self):
        """Test OAuth URL generation."""
        service = GitHubOAuthService()
        
        with patch.dict('os.environ', {'GITHUB_CLIENT_ID': 'test_client_id'}):
            url = service.get_authorization_url()
            
            assert "github.com" in url
            assert "client_id" in url
            assert "authorize" in url
    
    def test_get_authorization_url_with_state(self):
        """Test OAuth URL generation with state parameter."""
        service = GitHubOAuthService()
        
        with patch.dict('os.environ', {'GITHUB_CLIENT_ID': 'test_client_id'}):
            url = service.get_authorization_url("test_state")
            
            assert "github.com" in url
            assert "client_id" in url
            assert "state=test_state" in url
    
    def test_exchange_code_for_token_success(self):
        """Test successful access token retrieval."""
        service = GitHubOAuthService()
        
        with patch('app.services.github_oauth_service.requests.post') as mock_post:
            mock_response = MagicMock()
            mock_response.json.return_value = {"access_token": "test_token"}
            mock_response.status_code = 200
            mock_post.return_value = mock_response
            
            with patch.dict('os.environ', {
                'GITHUB_CLIENT_ID': 'test_client_id',
                'GITHUB_CLIENT_SECRET': 'test_client_secret'
            }):
                result = service.exchange_code_for_token("test_code")
                
                assert result is not None
                assert result["access_token"] == "test_token"
    
    def test_exchange_code_for_token_error_response(self):
        """Test access token retrieval with error response."""
        service = GitHubOAuthService()
        
        with patch('app.services.github_oauth_service.requests.post') as mock_post:
            mock_response = MagicMock()
            mock_response.json.return_value = {"error": "invalid_code"}
            mock_response.status_code = 400
            mock_post.return_value = mock_response
            
            with patch.dict('os.environ', {
                'GITHUB_CLIENT_ID': 'test_client_id',
                'GITHUB_CLIENT_SECRET': 'test_client_secret'
            }):
                result = service.exchange_code_for_token("invalid_code")
                
                assert result is None
    
    def test_exchange_code_for_token_network_error(self):
        """Test access token retrieval with network error."""
        service = GitHubOAuthService()
        
        with patch('app.services.github_oauth_service.requests.post') as mock_post:
            mock_post.side_effect = Exception("Network error")
            
            with patch.dict('os.environ', {
                'GITHUB_CLIENT_ID': 'test_client_id',
                'GITHUB_CLIENT_SECRET': 'test_client_secret'
            }):
                result = service.exchange_code_for_token("test_code")
                
                assert result is None
    
    def test_get_user_info_success(self):
        """Test successful user info retrieval."""
        service = GitHubOAuthService()
        
        with patch('app.services.github_oauth_service.requests.get') as mock_get:
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "id": 123,
                "login": "testuser",
                "name": "Test User",
                "email": "test@example.com"
            }
            mock_response.status_code = 200
            mock_get.return_value = mock_response
            
            user_info = service.get_user_info("test_token")
            
            assert user_info["id"] == 123
            assert user_info["login"] == "testuser"
            assert user_info["name"] == "Test User"
            assert user_info["email"] == "test@example.com"
    
    def test_get_user_info_unauthorized(self):
        """Test user info retrieval with invalid token."""
        service = GitHubOAuthService()
        
        with patch('app.services.github_oauth_service.requests.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 401
            mock_response.raise_for_status.side_effect = Exception("Unauthorized")
            mock_get.return_value = mock_response
            
            user_info = service.get_user_info("invalid_token")
            
            assert user_info is None
    
    def test_get_user_info_network_error(self):
        """Test user info retrieval with network error."""
        service = GitHubOAuthService()
        
        with patch('app.services.github_oauth_service.requests.get') as mock_get:
            mock_get.side_effect = Exception("Network error")
            
            user_info = service.get_user_info("test_token")
            
            assert user_info is None
    
    def test_encrypt_decrypt_token(self):
        """Test token encryption and decryption."""
        service = GitHubOAuthService()
        
        original_token = "test_token_123"
        encrypted = service.encrypt_token(original_token)
        decrypted = service.decrypt_token(encrypted)
        
        assert encrypted != original_token
        assert decrypted == original_token
    
    def test_validate_token_success(self):
        """Test successful token validation."""
        service = GitHubOAuthService()
        
        with patch.object(service, 'get_user_info') as mock_get_user_info:
            mock_get_user_info.return_value = {"id": 123, "login": "testuser"}
            
            is_valid = service.validate_token("valid_token")
            
            assert is_valid is True
    
    def test_validate_token_failure(self):
        """Test failed token validation."""
        service = GitHubOAuthService()
        
        with patch.object(service, 'get_user_info') as mock_get_user_info:
            mock_get_user_info.return_value = None
            
            is_valid = service.validate_token("invalid_token")
            
            assert is_valid is False 