from typing import Dict, Optional

from pydantic import BaseModel, Field


class EmailSettings(BaseModel):
    """Email notification settings."""

    email: str = Field(..., description="Email address for sending notifications")
    smtp_server: str = Field(
        default="smtp.gmail.com", description="SMTP server address"
    )
    smtp_port: int = Field(default=587, description="SMTP server port")
    password: str = Field(..., description="Email password or app password")


class PushSettings(BaseModel):
    """Push notification settings."""

    device_token: str = Field(..., description="Device token for push notifications")
    platform: str = Field(default="ios", description="Platform: ios, android")


class SmsSettings(BaseModel):
    """SMS notification settings."""

    phone_number: str = Field(..., description="Phone number for SMS notifications")
    provider: str = Field(default="twilio", description="SMS provider")


class NotificationChannelConfig(BaseModel):
    """Configuration for a single notification channel."""

    enabled: bool = Field(default=False, description="Whether this channel is enabled")
    settings: EmailSettings | PushSettings | SmsSettings = Field(
        ..., description="Channel-specific settings"
    )
    frequency: str = Field(
        default="daily", description="Notification frequency: daily, weekly"
    )


class NotificationConfig(BaseModel):
    """Complete notification configuration."""

    email: Optional[NotificationChannelConfig] = Field(
        default=None, description="Email notification configuration"
    )
    push: Optional[NotificationChannelConfig] = Field(
        default=None, description="Push notification configuration"
    )
    sms: Optional[NotificationChannelConfig] = Field(
        default=None, description="SMS notification configuration"
    )


class NotificationConfigUpdate(BaseModel):
    """Request model for updating notification configuration."""

    notification_config: NotificationConfig = Field(
        ..., description="Notification configuration"
    )


class NotificationConfigResponse(BaseModel):
    """Response model for notification configuration."""

    notification_config: NotificationConfig = Field(
        ..., description="Notification configuration"
    )
