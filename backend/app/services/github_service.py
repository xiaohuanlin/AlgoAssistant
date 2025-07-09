import os
import requests
from app.services.base_repo_service import BaseRepoService
from app.services.github_oauth_service import GitHubOAuthService
from typing import Any, Dict
from datetime import datetime

class GitHubService(BaseRepoService):
    """GitHub integration service implementation."""

    def __init__(self, user_config: Dict[str, Any] = None):
        super().__init__()
        self.user_config = user_config or {}
        self.oauth_service = GitHubOAuthService()

    def push_code(self, file_path: str, code: str, commit_message: str, repo_config: Dict[str, Any]) -> str:
        """Push code to GitHub repository using OAuth token."""
        # Get encrypted token from user config
        encrypted_token = self.user_config.get("github_token")
        if not encrypted_token:
            raise Exception("GitHub token not configured")
        
        # Decrypt token
        access_token = self.oauth_service.decrypt_token(encrypted_token)
        
        # Validate token
        if not self.oauth_service.validate_token(access_token):
            raise Exception("GitHub token is invalid or expired")
        
        # Get repository info
        repo = repo_config.get("repo", "user/repo")
        if "/" not in repo:
            raise Exception("Invalid repository format. Expected 'owner/repo'")
        
        owner, repo_name = repo.split("/", 1)
        
        # Create or update file using GitHub API
        api_url = f"https://api.github.com/repos/{owner}/{repo_name}/contents/{file_path}"
        
        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        # Check if file exists
        try:
            response = requests.get(api_url, headers=headers)
            if response.status_code == 200:
                # File exists, update it
                sha = response.json()["sha"]
                data = {
                    "message": commit_message,
                    "content": code.encode('utf-8').decode('latin1'),
                    "sha": sha
                }
            else:
                # File doesn't exist, create it
                data = {
                    "message": commit_message,
                    "content": code.encode('utf-8').decode('latin1')
                }
            
            response = requests.put(api_url, json=data, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            return result["commit"]["html_url"]
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to push code to GitHub: {str(e)}")

    def create_repository(self, repo_name: str, description: str = "") -> str:
        """Create a new GitHub repository."""
        encrypted_token = self.user_config.get("github_token")
        if not encrypted_token:
            raise Exception("GitHub token not configured")
        
        access_token = self.oauth_service.decrypt_token(encrypted_token)
        
        api_url = "https://api.github.com/user/repos"
        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        data = {
            "name": repo_name,
            "description": description,
            "private": False,
            "auto_init": True
        }
        
        try:
            response = requests.post(api_url, json=data, headers=headers)
            response.raise_for_status()
            result = response.json()
            return result["html_url"]
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to create repository: {str(e)}") 