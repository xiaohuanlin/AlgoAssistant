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


class EmailChannelConfig(BaseModel):
    enabled: bool = Field(default=False, description="Whether this channel is enabled")
    settings: EmailSettings = Field(..., description="Email channel settings")
    frequency: str = Field(
        default="daily", description="Notification frequency: daily, weekly"
    )


class PushChannelConfig(BaseModel):
    enabled: bool = Field(default=False, description="Whether this channel is enabled")
    settings: PushSettings = Field(..., description="Push channel settings")
    frequency: str = Field(
        default="daily", description="Notification frequency: daily, weekly"
    )


class SmsChannelConfig(BaseModel):
    enabled: bool = Field(default=False, description="Whether this channel is enabled")
    settings: SmsSettings = Field(..., description="SMS channel settings")
    frequency: str = Field(
        default="daily", description="Notification frequency: daily, weekly"
    )


class NotificationConfig(BaseModel):
    """Complete notification configuration."""

    email: Optional[EmailChannelConfig] = Field(
        default=None, description="Email notification configuration"
    )
    push: Optional[PushChannelConfig] = Field(
        default=None, description="Push notification configuration"
    )
    sms: Optional[SmsChannelConfig] = Field(
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
