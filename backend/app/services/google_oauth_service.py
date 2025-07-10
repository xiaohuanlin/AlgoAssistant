import os
import json
import base64
from typing import Dict, Optional
from google.oauth2 import id_token
from google.auth.transport import requests
from google_auth_oauthlib.flow import Flow
from cryptography.fernet import Fernet
from app.config import settings

class GoogleOAuthService:
    """Google OAuth service for authentication."""
    
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        # Use FERNET_KEY if available, otherwise generate from SECRET_KEY
        if settings.FERNET_KEY != "your-32-byte-base64-encoded-fernet-key":
            self._fernet = Fernet(settings.FERNET_KEY.encode())
        else:
            # Generate a proper Fernet key from SECRET_KEY
            key = base64.urlsafe_b64encode(settings.SECRET_KEY.encode()[:32].ljust(32, b'0'))
            self._fernet = Fernet(key)
    
    def get_authorization_url(self, state: str) -> str:
        """Generate Google OAuth authorization URL."""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri],
                    "scopes": ["openid", "email", "profile"]
                }
            },
            scopes=["openid", "email", "profile"]
        )
        flow.redirect_uri = self.redirect_uri
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state
        )
        return authorization_url
    
    def exchange_code_for_token(self, code: str) -> Optional[Dict]:
        """Exchange authorization code for access token."""
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri],
                        "scopes": ["openid", "email", "profile"]
                    }
                },
                scopes=["openid", "email", "profile"]
            )
            flow.redirect_uri = self.redirect_uri
            flow.fetch_token(code=code)
            
            # Get user info from ID token
            id_info = id_token.verify_oauth2_token(
                flow.credentials.id_token, 
                requests.Request(), 
                self.client_id
            )
            
            return {
                "access_token": flow.credentials.token,
                "id_token": flow.credentials.id_token,
                "user_info": id_info
            }
        except Exception as e:
            print(f"Error exchanging code for token: {e}")
            return None
    
    def verify_id_token(self, id_token_str: str) -> Optional[Dict]:
        """Verify Google ID token and return user info."""
        try:
            id_info = id_token.verify_oauth2_token(
                id_token_str, 
                requests.Request(), 
                self.client_id
            )
            return id_info
        except Exception as e:
            print(f"Error verifying ID token: {e}")
            return None
    
    def get_user_info_from_access_token(self, access_token: str) -> Optional[Dict]:
        """Get user info from Google access token."""
        try:
            # Use Google People API to get user info
            url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            
            import requests as http_requests
            response = http_requests.get(url, headers=headers)
            response.raise_for_status()
            
            user_info = response.json()
            return user_info
        except Exception as e:
            print(f"Error getting user info from access token: {e}")
            return None
    
    def encrypt_token(self, token: str) -> str:
        """Encrypt token for storage."""
        return self._fernet.encrypt(token.encode()).decode()
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt token from storage."""
        return self._fernet.decrypt(encrypted_token.encode()).decode() 