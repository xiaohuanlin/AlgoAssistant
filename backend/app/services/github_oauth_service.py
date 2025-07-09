import os
import requests
from typing import Dict, Optional
from urllib.parse import urlencode
from app.utils.security import encrypt_data, decrypt_data

class GitHubOAuthService:
    """Service for handling GitHub OAuth flow and token management."""
    
    def __init__(self):
        self.client_id = os.getenv("GITHUB_CLIENT_ID")
        self.client_secret = os.getenv("GITHUB_CLIENT_SECRET")
        self.redirect_uri = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/github/callback")
        self.base_url = "https://github.com"
        self.api_url = "https://api.github.com"
    
    def get_authorization_url(self, state: str = None) -> str:
        """Generate GitHub OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "repo",  # Request repository access
            "response_type": "code"
        }
        if state:
            params["state"] = state
        return f"{self.base_url}/login/oauth/authorize?{urlencode(params)}"
    
    def exchange_code_for_token(self, code: str) -> Optional[Dict]:
        """Exchange authorization code for access token."""
        url = f"{self.base_url}/login/oauth/access_token"
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri
        }
        headers = {"Accept": "application/json"}
        
        try:
            response = requests.post(url, data=data, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            if "access_token" in result:
                return {
                    "access_token": result["access_token"],
                    "token_type": result.get("token_type", "bearer"),
                    "scope": result.get("scope", "")
                }
            else:
                return None
        except Exception as e:
            print(f"Error exchanging code for token: {e}")
            return None
    
    def get_user_info(self, access_token: str) -> Optional[Dict]:
        """Get GitHub user information using access token."""
        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        try:
            response = requests.get(f"{self.api_url}/user", headers=headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error getting user info: {e}")
            return None
    
    def encrypt_token(self, token: str) -> str:
        """Encrypt GitHub access token for storage."""
        return encrypt_data(token)
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt GitHub access token from storage."""
        return decrypt_data(encrypted_token)
    
    def validate_token(self, access_token: str) -> bool:
        """Validate if GitHub access token is still valid."""
        user_info = self.get_user_info(access_token)
        return user_info is not None 