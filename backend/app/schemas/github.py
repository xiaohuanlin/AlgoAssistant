from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class GitHubSyncStatus(str, Enum):
    """GitHub synchronization status values for tracking sync operations."""

    PENDING = "pending"
    SYNCING = "syncing"
    SYNCED = "synced"
    FAILED = "failed"
    PAUSED = "paused"
    RETRY = "retry"


class GitHubSyncTaskStatus(str, Enum):
    """GitHub sync task status values for background task management."""

    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


class GitHubConfig(BaseModel):
    """GitHub integration configuration for repository management and code synchronization."""

    repo_url: str = Field(
        max_length=200,
        description="GitHub repository URL in format 'https://github.com/owner/repo'. Example: 'https://github.com/john-doe/leetcode-solutions'. Used for code pushing and repository access.",
    )
    branch: str = Field(
        default="main",
        max_length=100,
        description="Target branch for code pushing operations. Defaults to 'main' if not specified. Must be an existing branch in the repository.",
    )
    base_path: str = Field(
        default="solutions",
        max_length=200,
        description="Base directory path within the repository for storing solution files. Creates organized folder structure for different platforms.",
    )
    file_template: str = Field(
        default="solution_{date}_{time}.{ext}",
        max_length=200,
        description="Template for file naming with placeholders. Supports {date}, {time}, {problem_title}, {language}, {ext} placeholders for dynamic naming.",
    )
    commit_message_template: str = Field(
        default="Update {problem_title} on {date}",
        max_length=500,
        description="Template for commit messages when pushing code. Supports {problem_title}, {last_commit_date_inc_1_day}, {date} placeholders for meaningful commit history.",
    )
    token: str = Field(
        max_length=1000,
        description="GitHub personal access token for authentication. Must have repo scope permissions. Encrypted in storage for security.",
    )


class GitHubSyncRequest(BaseModel):
    """Request schema for GitHub synchronization operations."""

    record_ids: Optional[List[int]] = Field(
        None,
        max_length=1000,
        description="Specific record IDs to sync to GitHub. If not provided, all pending records will be synced. Maximum 1000 records per request.",
    )
    sync_all_pending: bool = Field(
        default=False,
        description="Flag to sync all pending records instead of specific IDs. Overrides record_ids if set to true.",
    )


class GitHubSyncResponse(BaseModel):
    """Response schema for GitHub synchronization operation results."""

    status: str = Field(
        ...,
        max_length=20,
        description="Sync operation status. Values: 'success', 'partial_success', 'failed'.",
    )
    message: str = Field(
        ...,
        max_length=1000,
        description="Detailed status message explaining the sync operation result and any issues encountered.",
    )
    total_records: int = Field(
        ...,
        ge=0,
        description="Total number of records processed during the sync operation. Must be non-negative integer.",
    )
    synced_records: int = Field(
        default=0,
        ge=0,
        description="Number of records successfully synced to GitHub. Must be non-negative integer.",
    )
    failed_records: int = Field(
        default=0,
        ge=0,
        description="Number of records that failed to sync. Must be non-negative integer.",
    )


class GitHubSyncTaskOut(BaseModel):
    """Response schema for GitHub sync task data with progress tracking."""

    id: int = Field(
        ...,
        description="Unique sync task identifier in the database. Auto-generated sequential integer.",
    )
    user_id: int = Field(
        ...,
        description="User ID who owns this sync task. Links to the User table for data isolation.",
    )
    status: GitHubSyncTaskStatus = Field(
        ...,
        description="Current task status indicating the progress of the sync operation.",
    )
    total_records: int = Field(
        ...,
        ge=0,
        description="Total number of records to be synced in this task. Must be non-negative integer.",
    )
    synced_records: int = Field(
        ...,
        ge=0,
        description="Number of records successfully synced so far. Updated during task execution.",
    )
    failed_records: int = Field(
        ...,
        ge=0,
        description="Number of records that failed to sync. Updated during task execution.",
    )
    created_at: datetime = Field(
        ..., description="Task creation timestamp in ISO 8601 format (UTC timezone)."
    )
    updated_at: datetime = Field(
        ...,
        description="Last task update timestamp in ISO 8601 format (UTC timezone). Updated during task execution.",
    )

    model_config = ConfigDict(from_attributes=True)


class GitHubConnectionTestOut(BaseModel):
    """Response schema for GitHub connection test results."""

    message: str = Field(
        ...,
        max_length=500,
        description="Connection test result message indicating success or failure with details.",
    )
    connected: bool = Field(
        default=True,
        description="Boolean flag indicating whether GitHub is successfully connected and accessible.",
    )


class GitHubPushRequest(BaseModel):
    """Request schema for pushing code to GitHub repository."""

    github_token: str = Field(
        ...,
        max_length=1000,
        description="GitHub access token for authentication. Must have repo scope permissions for the target repository.",
    )
    repo_url: Optional[str] = Field(
        None,
        max_length=200,
        description="Target repository URL in format 'owner/repo'. If not provided, uses the configured repository.",
    )
    branch: Optional[str] = Field(
        None,
        max_length=100,
        description="Target branch name for pushing code. If not provided, uses the configured branch.",
    )
    base_path: Optional[str] = Field(
        None,
        max_length=200,
        description="Base path within the repository for storing solutions. If not provided, uses the configured base path.",
    )


class GitHubPushResponse(BaseModel):
    """Response schema for GitHub code push operation results."""

    message: str = Field(
        ...,
        max_length=1000,
        description="Push operation result message indicating success or failure with details.",
    )
    github_url: Optional[str] = Field(
        None,
        max_length=500,
        description="URL to the pushed commit on GitHub. Provided when push operation is successful for easy access.",
    )
