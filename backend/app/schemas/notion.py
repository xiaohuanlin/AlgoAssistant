from typing import Optional

from pydantic import BaseModel, Field


class NotionConfig(BaseModel):
    """Notion integration configuration for knowledge base synchronization and note management."""

    token: Optional[str] = Field(
        None,
        max_length=1000,
        description="Notion API token for authentication and API access. Required for creating and updating pages in Notion databases. Encrypted in storage for security.",
    )
    db_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Notion database ID for storing problem records. Used as the target database for automatic synchronization of problem solutions and metadata.",
    )


class NotionConnectionTestOut(BaseModel):
    """Response schema for Notion connection test results."""

    message: str = Field(
        ...,
        max_length=500,
        description="Connection test result message indicating success or failure with details about the Notion API connection.",
    )
    connected: bool = Field(
        default=True,
        description="Boolean flag indicating whether Notion is successfully connected and accessible via the configured API token.",
    )
