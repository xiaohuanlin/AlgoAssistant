from typing import List, Optional

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


class NotionSyncRequest(BaseModel):
    """Request schema for Notion synchronization operations."""

    record_ids: Optional[List[int]] = Field(
        None,
        max_items=1000,
        description="Specific record IDs to sync to Notion. If not provided, all pending records will be synced. Maximum 1000 records per request.",
    )
    sync_all_pending: bool = Field(
        default=False,
        description="Flag to sync all pending records instead of specific IDs. Overrides record_ids if set to true.",
    )


class NotionSyncResponse(BaseModel):
    """Response schema for Notion synchronization operation results."""

    status: str = Field(
        ...,
        max_length=20,
        description="Sync operation status. Values: 'success', 'partial_success', 'failed'.",
    )
    message: str = Field(
        ...,
        max_length=1000,
        description="Detailed status message explaining the sync operation result and any issues encountered during Notion synchronization.",
    )
    total_records: int = Field(
        ...,
        ge=0,
        description="Total number of records processed during the Notion sync operation. Must be non-negative integer.",
    )
    synced_records: int = Field(
        ...,
        ge=0,
        description="Number of records successfully synced to Notion database. Must be non-negative integer.",
    )
    failed_records: int = Field(
        ...,
        ge=0,
        description="Number of records that failed to sync to Notion. Must be non-negative integer.",
    )
