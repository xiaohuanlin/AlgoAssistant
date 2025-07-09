import pytest
from unittest.mock import patch, MagicMock
from app.services.github_service import GitHubService

class TestGitHubService:
    """Test GitHubService functionality."""
    
    def test_push_code_success(self):
        """Test successful code push to GitHub."""
        user_config = {"github_token": "encrypted_token"}
        service = GitHubService(user_config)
        
        with patch.object(service.oauth_service, 'decrypt_token') as mock_decrypt:
            mock_decrypt.return_value = "decrypted_token"
            
            with patch.object(service.oauth_service, 'validate_token') as mock_validate:
                mock_validate.return_value = True
                
                with patch('app.services.github_service.requests.get') as mock_get:
                    mock_get.return_value.status_code = 404  # File doesn't exist
                    
                    with patch('app.services.github_service.requests.put') as mock_put:
                        mock_response = MagicMock()
                        mock_response.json.return_value = {
                            "commit": {"html_url": "https://github.com/user/repo/commit/123"}
                        }
                        mock_put.return_value = mock_response
                        
                        repo_config = {"repo": "user/repo"}
                        result = service.push_code("test.py", "print('hello')", "Add test file", repo_config)
                        
                        assert result == "https://github.com/user/repo/commit/123"
    
    def test_push_code_update_existing_file(self):
        """Test updating existing file in GitHub."""
        user_config = {"github_token": "encrypted_token"}
        service = GitHubService(user_config)
        
        with patch.object(service.oauth_service, 'decrypt_token') as mock_decrypt:
            mock_decrypt.return_value = "decrypted_token"
            
            with patch.object(service.oauth_service, 'validate_token') as mock_validate:
                mock_validate.return_value = True
                
                with patch('app.services.github_service.requests.get') as mock_get:
                    mock_get.return_value.status_code = 200
                    mock_get.return_value.json.return_value = {"sha": "abc123"}
                    
                    with patch('app.services.github_service.requests.put') as mock_put:
                        mock_response = MagicMock()
                        mock_response.json.return_value = {
                            "commit": {"html_url": "https://github.com/user/repo/commit/456"}
                        }
                        mock_put.return_value = mock_response
                        
                        repo_config = {"repo": "user/repo"}
                        result = service.push_code("test.py", "print('updated')", "Update test file", repo_config)
                        
                        assert result == "https://github.com/user/repo/commit/456"
    
    def test_push_code_no_token(self):
        """Test push code without GitHub token."""
        user_config = {}
        service = GitHubService(user_config)
        
        repo_config = {"repo": "user/repo"}
        
        with pytest.raises(Exception) as exc_info:
            service.push_code("test.py", "print('hello')", "Add test file", repo_config)
        
        assert "GitHub token not configured" in str(exc_info.value)
    
    def test_push_code_invalid_token(self):
        """Test push code with invalid token."""
        user_config = {"github_token": "encrypted_token"}
        service = GitHubService(user_config)
        
        with patch.object(service.oauth_service, 'decrypt_token') as mock_decrypt:
            mock_decrypt.return_value = "decrypted_token"
            
            with patch.object(service.oauth_service, 'validate_token') as mock_validate:
                mock_validate.return_value = False
                
                repo_config = {"repo": "user/repo"}
                
                with pytest.raises(Exception) as exc_info:
                    service.push_code("test.py", "print('hello')", "Add test file", repo_config)
                
                assert "GitHub token is invalid or expired" in str(exc_info.value)
    
    def test_push_code_invalid_repo_format(self):
        """Test push code with invalid repository format."""
        user_config = {"github_token": "encrypted_token"}
        service = GitHubService(user_config)
        
        with patch.object(service.oauth_service, 'decrypt_token') as mock_decrypt:
            mock_decrypt.return_value = "decrypted_token"
            
            with patch.object(service.oauth_service, 'validate_token') as mock_validate:
                mock_validate.return_value = True
                
                repo_config = {"repo": "invalid_repo_format"}
                
                with pytest.raises(Exception) as exc_info:
                    service.push_code("test.py", "print('hello')", "Add test file", repo_config)
                
                assert "Invalid repository format" in str(exc_info.value)
    
    def test_create_repository_success(self):
        """Test successful repository creation."""
        user_config = {"github_token": "encrypted_token"}
        service = GitHubService(user_config)
        
        with patch.object(service.oauth_service, 'decrypt_token') as mock_decrypt:
            mock_decrypt.return_value = "decrypted_token"
            
            with patch('app.services.github_service.requests.post') as mock_post:
                mock_response = MagicMock()
                mock_response.json.return_value = {"html_url": "https://github.com/user/new-repo"}
                mock_post.return_value = mock_response
                
                result = service.create_repository("new-repo", "Test repository")
                
                assert result == "https://github.com/user/new-repo"
    
    def test_create_repository_no_token(self):
        """Test repository creation without GitHub token."""
        user_config = {}
        service = GitHubService(user_config)
        
        with pytest.raises(Exception) as exc_info:
            service.create_repository("new-repo", "Test repository")
        
        assert "GitHub token not configured" in str(exc_info.value) 