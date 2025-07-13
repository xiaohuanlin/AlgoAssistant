from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class GoogleLoginRequest(BaseModel):
    """Request schema for Google OAuth login with access token authentication."""

    access_token: str = Field(
        ...,
        max_length=1000,
        description="Google OAuth access token for authentication. Obtained from Google OAuth flow and used to verify user identity and get user information.",
    )


class GoogleLoginResponse(BaseModel):
    """Response schema for successful Google OAuth login with JWT token."""

    access_token: str = Field(
        ...,
        max_length=2000,
        description="JWT access token for API authentication. Valid for 30 minutes by default. Include in Authorization header for subsequent requests.",
    )
    token_type: str = Field(
        ...,
        max_length=20,
        description="Token type identifier. Always 'bearer' for JWT tokens.",
    )
    user: Dict[str, Any] = Field(
        ...,
        description="User information retrieved from Google including id, username, email, nickname, and profile picture URL.",
    )


class GoogleConfig(BaseModel):
    """Google OAuth configuration for authentication and calendar integration."""

    token: Optional[str] = Field(
        None,
        max_length=1000,
        description="Google OAuth access token for authentication and API access. Encrypted in storage for security. Used for user authentication and calendar operations.",
    )


class GoogleAuthResponse(BaseModel):
    """Response schema for Google OAuth authorization URL generation."""

    auth_url: str = Field(
        ...,
        max_length=1000,
        description="Google OAuth authorization URL for frontend redirect. Contains client_id, redirect_uri, scope, and state parameters for secure OAuth flow.",
    )


class GoogleCallbackResponse(BaseModel):
    """Response schema for Google OAuth callback processing and user creation."""

    success: bool = Field(
        ...,
        description="Boolean flag indicating whether OAuth callback was processed successfully. True if user was authenticated or created successfully.",
    )
    provider: str = Field(
        ...,
        max_length=20,
        description="OAuth provider name. Always 'google' for Google OAuth integration.",
    )
    email: Optional[str] = Field(
        None,
        max_length=255,
        description="User's email address from Google account. Used for account identification and communication.",
    )
    name: Optional[str] = Field(
        None,
        max_length=100,
        description="User's display name from Google account. Used as default nickname in the application.",
    )
    picture: Optional[str] = Field(
        None,
        max_length=500,
        description="URL to user's Google profile picture. Used as default avatar in the application.",
    )
    message: str = Field(
        ...,
        max_length=500,
        description="Detailed callback result message explaining success or failure with specific details.",
    )


class GoogleStatusResponse(BaseModel):
    """Response schema for Google connection status check and validation."""

    connected: bool = Field(
        ...,
        description="Boolean flag indicating whether Google is successfully connected and token is valid. True if user has valid Google OAuth token.",
    )
    message: str = Field(
        ...,
        max_length=500,
        description="Connection status message indicating whether Google is connected successfully or explaining any connection issues.",
    )


class GoogleDisconnectResponse(BaseModel):
    """Response schema for Google disconnection confirmation and cleanup."""

    message: str = Field(
        ...,
        max_length=500,
        description="Disconnection confirmation message indicating successful removal of Google OAuth token and account disconnection.",
    )
