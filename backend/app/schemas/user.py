from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.gemini import GeminiConfig
from app.schemas.github import GitHubConfig
from app.schemas.google import GoogleConfig
from app.schemas.leetcode import LeetCodeConfig
from app.schemas.notion import NotionConfig
from app.schemas.notification import NotificationConfig


class UserBase(BaseModel):
    """Base user model with common fields for user account management."""

    username: str = Field(
        ...,
        max_length=32,
        description="Unique username for login and identification. Must be alphanumeric and between 3-32 characters.",
    )
    email: EmailStr = Field(
        ...,
        description="User's email address for account verification and password recovery. Must be a valid email format.",
    )
    nickname: Optional[str] = Field(
        None,
        max_length=50,
        description="Display name for the user interface. Can be different from username and supports international characters.",
    )
    avatar: Optional[str] = Field(
        None,
        max_length=500,
        description="URL to user's profile picture or avatar image. Supports common image formats (JPG, PNG, GIF).",
    )


class UserCreate(UserBase):
    """Schema for user registration with password validation."""

    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        description="User password for account security. Minimum 6 characters, should include letters and numbers for better security.",
    )


class UserLogin(BaseModel):
    """Schema for user authentication during login process."""

    username: str = Field(
        ...,
        description="Username or email address for authentication. Can be either the registered username or email.",
    )
    password: str = Field(
        ...,
        description="User password for authentication. Must match the password used during registration.",
    )


class UserLoginResponse(BaseModel):
    """Response schema for successful login with JWT token."""

    access_token: str = Field(
        ...,
        description="JWT access token for API authentication. Valid for 30 minutes by default. Include in Authorization header for subsequent requests.",
    )
    token_type: str = Field(
        default="bearer",
        description="Token type identifier. Always 'bearer' for JWT tokens.",
    )
    user: "UserOut" = Field(
        ...,
        description="User profile information including username, email, nickname, and avatar. Excludes sensitive data like password hash.",
    )


class UserOut(UserBase):
    """Response schema for user data (excludes sensitive information like password)."""

    id: int = Field(
        ...,
        description="Unique user identifier in the database. Auto-generated sequential integer.",
    )
    created_at: datetime = Field(
        ...,
        description="User account creation timestamp in ISO 8601 format (UTC timezone).",
    )
    updated_at: datetime = Field(
        ...,
        description="Last user data update timestamp in ISO 8601 format (UTC timezone).",
    )
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """Schema for updating user profile information with optional fields."""

    username: Optional[str] = Field(
        None,
        max_length=32,
        description="New username for the account. Must be unique and alphanumeric.",
    )
    email: Optional[EmailStr] = Field(
        None,
        description="New email address for the account. Must be unique and valid email format.",
    )
    nickname: Optional[str] = Field(
        None, max_length=50, description="New display name for the user interface."
    )
    avatar: Optional[str] = Field(
        None,
        max_length=500,
        description="New profile picture URL. Must be accessible and valid image format.",
    )
    password: Optional[str] = Field(
        None,
        min_length=6,
        max_length=128,
        description="New password for the account. Will be hashed before storage.",
    )


class UserConfigBase(BaseModel):
    """Base user configuration model for third-party service integrations."""

    github_config: Optional[GitHubConfig] = Field(
        None,
        description="GitHub integration settings for code repository management and OAuth authentication.",
    )
    leetcode_config: Optional[LeetCodeConfig] = Field(
        None,
        description="LeetCode integration settings for problem synchronization and session management.",
    )
    notion_config: Optional[NotionConfig] = Field(
        None,
        description="Notion integration settings for knowledge base synchronization and note management.",
    )
    gemini_config: Optional[GeminiConfig] = Field(
        None,
        description="Gemini AI service configuration for code analysis using Google's Gemini model.",
    )
    google_config: Optional[GoogleConfig] = Field(
        None,
        description="Google OAuth settings for authentication and calendar integration.",
    )
    notification_config: Optional[NotificationConfig] = Field(
        None,
        description="Notification settings for email, push, and SMS notifications.",
    )
    model_config = ConfigDict(from_attributes=True)


class UserConfigCreate(BaseModel):
    """Schema for creating user configuration with third-party service credentials."""

    github_config: Optional[GitHubConfig] = Field(
        None,
        description="GitHub repository settings including repository URL, branch, file templates, and encrypted access token.",
    )
    leetcode_config: Optional[LeetCodeConfig] = Field(
        None,
        description="LeetCode session configuration including encrypted session cookie and username for problem synchronization.",
    )
    notion_config: Optional[NotionConfig] = Field(
        None,
        description="Notion workspace settings including encrypted API token and target database ID for record synchronization.",
    )
    gemini_config: Optional[GeminiConfig] = Field(
        None,
        description="Gemini AI service configuration including encrypted API key for code analysis using Google's Gemini model.",
    )
    google_config: Optional[GoogleConfig] = Field(
        None,
        description="Google OAuth configuration including encrypted access token for authentication and calendar integration.",
    )
    notification_config: Optional[NotificationConfig] = Field(
        None,
        description="Notification settings for email, push, and SMS notifications.",
    )


class UserConfigOut(BaseModel):
    """Response schema for user configuration (excludes sensitive tokens for security)."""

    id: int = Field(
        ...,
        description="Configuration record identifier in the database. Auto-generated sequential integer.",
    )
    user_id: int = Field(
        ...,
        description="Associated user ID that owns this configuration. Links to the User table.",
    )
    github_config: Optional[GitHubConfig] = Field(
        None,
        description="GitHub settings excluding sensitive token information for security.",
    )
    leetcode_config: Optional[LeetCodeConfig] = Field(
        None,
        description="LeetCode settings excluding sensitive session cookie for security.",
    )
    notion_config: Optional[NotionConfig] = Field(
        None, description="Notion settings excluding sensitive API token for security."
    )
    gemini_config: Optional[GeminiConfig] = Field(
        None, description="Gemini settings excluding sensitive API key for security."
    )
    google_config: Optional[GoogleConfig] = Field(
        None,
        description="Google settings excluding sensitive OAuth token for security.",
    )
    notification_config: Optional[NotificationConfig] = Field(
        None,
        description="Notification settings for email, push, and SMS notifications.",
    )
    created_at: datetime = Field(
        ...,
        description="Configuration creation timestamp in ISO 8601 format (UTC timezone).",
    )
    updated_at: datetime = Field(
        ...,
        description="Last configuration update timestamp in ISO 8601 format (UTC timezone).",
    )

    class Config:
        from_attributes = True
