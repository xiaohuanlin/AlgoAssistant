from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.gemini import GeminiAIAnalysisSchema


class SyncStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    RETRY = "retry"


class OJType(str, Enum):
    """Online Judge platform types for problem submission tracking."""

    leetcode = "leetcode"
    nowcoder = "nowcoder"
    other = "other"


class LanguageType(str, Enum):
    """Programming language types supported by the platform."""

    python = "python"
    python3 = "python3"
    java = "java"
    cpp = "cpp"
    javascript = "javascript"
    typescript = "typescript"
    go = "go"
    rust = "rust"
    other = "other"


class SyncTaskType(str, Enum):
    GITHUB_SYNC = "github_sync"
    LEETCODE_BATCH_SYNC = "leetcode_batch_sync"
    LEETCODE_DETAIL_SYNC = "leetcode_detail_sync"
    NOTION_SYNC = "notion_sync"
    AI_ANALYSIS = "ai_analysis"
    GEMINI_SYNC = "gemini_sync"
    OTHER = "other"


class RecordCreate(BaseModel):
    problem_id: int = Field(..., description="The ID of the problem")
    oj_type: str = Field(..., description="The type of the online judge platform")
    execution_result: str = Field(
        ...,
        description="The result of the solution, e.g., Accepted, Wrong Answer, Time Limit Exceeded, etc.",
    )
    language: str = Field(
        ..., description="The language of the solution, e.g., Python, Java, C++, etc."
    )
    code: Optional[str] = Field(None, description="The code of the solution")
    submit_time: datetime = Field(
        ..., description="The time when the solution was submitted"
    )
    runtime: Optional[str] = Field(
        None, description="The runtime of the solution, e.g., 100ms, 1s, etc."
    )
    memory: Optional[str] = Field(
        None, description="The memory of the solution, e.g., 100MB, 1GB, etc."
    )
    runtime_percentile: Optional[float] = Field(
        None, description="The runtime percentile of the solution, e.g., 50%, 90%, etc."
    )
    memory_percentile: Optional[float] = Field(
        None, description="The memory percentile of the solution, e.g., 50%, 90%, etc."
    )
    total_correct: Optional[int] = Field(
        None, description="The total number of correct submissions"
    )
    total_testcases: Optional[int] = Field(
        None, description="The total number of test cases"
    )
    topic_tags: Optional[List[str]] = Field(None, description="The tags of the problem")
    ai_analysis: Optional[GeminiAIAnalysisSchema] = Field(
        None, description="The analysis of the solution"
    )
    # The following fields are only allowed to be written by sync tasks, not by user manual creation
    oj_sync_status: SyncStatus = Field(
        default=SyncStatus.PENDING, description="The status of the OJ synchronization"
    )
    github_sync_status: SyncStatus = Field(
        default=SyncStatus.PENDING,
        description="The status of the GitHub synchronization",
    )
    ai_sync_status: SyncStatus = Field(
        default=SyncStatus.PENDING, description="The status of the AI synchronization"
    )
    notion_sync_status: SyncStatus = Field(
        default=SyncStatus.PENDING,
        description="The status of the Notion synchronization",
    )
    submission_id: int = Field(..., description="The ID of the submission")
    submission_url: str = Field(..., description="The URL of the submission")
    notion_url: Optional[str] = Field(
        None, description="The URL of the problem in Notion"
    )
    notion_page_id: Optional[str] = Field(
        None, description="The Notion page ID for updates"
    )
    git_file_path: Optional[str] = Field(
        None, description="The path of the solution in the git repository"
    )

    class Config:
        orm_mode = True


class RecordListOut(BaseModel):
    """Response schema for record data with additional metadata and synchronization status."""

    id: int = Field(..., description="The ID of the record")
    problem_title: str = Field(..., description="The title of the problem")
    problem_number: int = Field(..., description="The number of the problem")
    execution_result: str = Field(
        ...,
        description="The result of the solution, e.g., Accepted, Wrong Answer, Time Limit Exceeded, etc.",
    )
    oj_type: str = Field(..., description="The type of the online judge platform")
    language: str = Field(
        ..., description="The language of the solution, e.g., Python, Java, C++, etc."
    )
    oj_sync_status: SyncStatus = Field(
        ..., description="The status of the OJ synchronization"
    )
    github_sync_status: SyncStatus = Field(
        ..., description="The status of the GitHub synchronization"
    )
    ai_sync_status: SyncStatus = Field(
        ..., description="The status of the AI synchronization"
    )
    notion_sync_status: SyncStatus = Field(
        ..., description="The status of the Notion synchronization"
    )
    submit_time: datetime = Field(
        ..., description="The time when the solution was submitted"
    )
    topic_tags: Optional[List[str]] = Field(None, description="The tags of the problem")
    git_file_path: Optional[str] = Field(
        None, description="The path of the solution in the git repository"
    )
    notion_url: Optional[str] = Field(
        None, description="The URL of the problem in Notion"
    )
    submission_url: str = Field(..., description="The URL of the submission")


class RecordDetailOut(BaseModel):
    id: int = Field(..., description="The ID of the record")
    user_id: int = Field(..., description="The ID of the user")
    problem_id: int = Field(..., description="The ID of the problem")
    problem_title: str = Field(..., description="The title of the problem")
    problem_number: int = Field(..., description="The number of the problem")
    oj_type: str = Field(..., description="The type of the online judge platform")
    execution_result: str = Field(
        ...,
        description="The result of the solution, e.g., Accepted, Wrong Answer, Time Limit Exceeded, etc.",
    )
    language: str = Field(
        ..., description="The language of the solution, e.g., Python, Java, C++, etc."
    )
    code: str = Field(..., description="The code of the solution")
    submit_time: datetime = Field(
        ..., description="The time when the solution was submitted"
    )
    runtime: Optional[str] = Field(
        None, description="The runtime of the solution, e.g., 100ms, 1s, etc."
    )
    memory: Optional[str] = Field(
        ..., description="The memory of the solution, e.g., 100MB, 1GB, etc."
    )
    runtime_percentile: Optional[float] = Field(
        ..., description="The runtime percentile of the solution, e.g., 50%, 90%, etc."
    )
    memory_percentile: Optional[float] = Field(
        None, description="The memory percentile of the solution, e.g., 50%, 90%, etc."
    )
    total_correct: Optional[int] = Field(
        None, description="The total number of correct submissions"
    )
    total_testcases: Optional[int] = Field(
        None, description="The total number of test cases"
    )
    topic_tags: Optional[List[str]] = Field(None, description="The tags of the problem")
    ai_analysis: Optional[GeminiAIAnalysisSchema] = Field(
        None, description="The analysis of the solution"
    )
    oj_sync_status: SyncStatus = Field(
        ..., description="The status of the OJ synchronization"
    )
    github_sync_status: SyncStatus = Field(
        ..., description="The status of the GitHub synchronization"
    )
    ai_sync_status: SyncStatus = Field(
        ..., description="The status of the AI synchronization"
    )
    notion_sync_status: SyncStatus = Field(
        ..., description="The status of the Notion synchronization"
    )
    submission_url: str = Field(..., description="The URL of the submission")
    notion_url: Optional[str] = Field(
        None, description="The URL of the problem in Notion"
    )
    notion_page_id: Optional[str] = Field(
        None, description="The Notion page ID for updates"
    )
    git_file_path: Optional[str] = Field(
        None, description="The path of the solution in the git repository"
    )
    created_at: datetime = Field(
        ..., description="The time when the record was created"
    )
    updated_at: datetime = Field(
        ..., description="The time when the record was updated"
    )


class RecordUpdate(BaseModel):
    """Schema for updating a problem record."""

    code: Optional[str] = Field(None, description="The code of the solution")
    runtime: Optional[str] = Field(
        None, description="The runtime of the solution, e.g., 100ms, 1s, etc."
    )
    memory: Optional[str] = Field(
        None, description="The memory of the solution, e.g., 100MB, 1GB, etc."
    )
    runtime_percentile: Optional[float] = Field(
        None, description="The runtime percentile of the solution, e.g., 50%, 90%, etc."
    )
    memory_percentile: Optional[float] = Field(
        None, description="The memory percentile of the solution, e.g., 50%, 90%, etc."
    )
    total_correct: Optional[int] = Field(
        None, description="The total number of correct submissions"
    )
    total_testcases: Optional[int] = Field(
        None, description="The total number of test cases"
    )
    topic_tags: Optional[List[str]] = Field(None, description="The tags of the problem")
    ai_analysis: Optional[GeminiAIAnalysisSchema] = Field(
        None, description="The analysis of the solution"
    )
    oj_sync_status: Optional[SyncStatus] = Field(
        None, description="The status of the OJ synchronization"
    )
    github_sync_status: Optional[SyncStatus] = Field(
        None, description="The status of the GitHub synchronization"
    )
    ai_sync_status: Optional[SyncStatus] = Field(
        None, description="The status of the AI synchronization"
    )
    notion_sync_status: Optional[SyncStatus] = Field(
        None, description="The status of the Notion synchronization"
    )
    notion_page_id: Optional[str] = Field(
        None, description="The Notion page ID for updates"
    )
    submission_url: Optional[str] = Field(None, description="The URL of the submission")
    notion_url: Optional[str] = Field(
        None, description="The URL of the problem in Notion"
    )
    git_file_path: Optional[str] = Field(
        None, description="The path of the solution in the git repository"
    )


class TagBase(BaseModel):
    """Base tag model for algorithm categorization and knowledge organization."""

    name: str = Field(
        ...,
        max_length=100,
        description="Tag name for algorithm or data structure categorization. Examples: 'Two Pointers', 'Dynamic Programming', 'Binary Search'.",
    )
    wiki: Optional[str] = Field(
        None,
        max_length=2000,
        description="Wiki documentation for the tag explaining the concept, implementation, and common use cases. Supports markdown formatting.",
    )


class TagCreate(TagBase):
    """Schema for creating a new algorithm tag."""

    pass


class TagOut(TagBase):
    """Response schema for tag data with timestamps."""

    id: int = Field(
        ...,
        description="Unique tag identifier in the database. Auto-generated sequential integer.",
    )
    created_at: datetime = Field(
        ..., description="Tag creation timestamp in ISO 8601 format (UTC timezone)."
    )
    updated_at: datetime = Field(
        ..., description="Last tag update timestamp in ISO 8601 format (UTC timezone)."
    )

    class Config:
        from_attributes = True


class SyncTaskCreate(BaseModel):
    """Schema for creating a new synchronization task for background processing."""

    type: str = Field(
        ...,
        max_length=50,
        description="Task type for synchronization. Valid values: 'github_sync', 'leetcode_batch_sync', 'leetcode_detail_sync', 'notion_sync', 'gemini_sync'.",
    )
    record_ids: Optional[List[int]] = Field(
        None,
        description="List of record IDs to be processed by this task. If empty, all records will be processed.",
    )
    total_records: Optional[int] = Field(
        None,
        ge=0,
        description="Total number of records to sync for this task. Used for batch sync tasks.",
    )


class SyncTaskQuery(BaseModel):
    """Schema for querying synchronization tasks with filtering options."""

    type: Optional[str] = Field(
        None,
        max_length=50,
        description="Filter by task type. Valid values: 'github_sync,leetcode_batch_sync', leetcode_detail_sync', notion_sync', 'gemini_sync'.",
    )
    status: Optional[str] = Field(
        None,
        max_length=20,
        description="Filter by task status. Valid values: 'pending', 'running', 'completed', 'failed'.",
    )
    limit: int = Field(
        default=100,
        ge=1,
        le=1000,
        description="Maximum number of tasks to return. Must be between 1 and 1000.",
    )
    offset: int = Field(
        default=0,
        ge=0,
        description="Number of tasks to skip for pagination. Must be non-negative.",
    )


class SyncTaskOut(BaseModel):
    """Response schema for synchronization task data with progress tracking."""

    id: int = Field(
        ...,
        description="Unique task identifier in the database. Auto-generated sequential integer.",
    )
    user_id: int = Field(
        ...,
        description="User ID who owns this task. Links to the User table for data isolation.",
    )
    type: str = Field(
        ...,
        max_length=50,
        description="Task type indicating the synchronization operation being performed.",
    )
    status: str = Field(
        ...,
        max_length=20,
        description="Current task status. Values: 'pending' (waiting to start), 'running' (currently executing), 'completed' (finished successfully), 'failed' (encountered error).",
    )
    record_ids: Optional[List[int]] = Field(
        None,
        description="List of record IDs being processed by this task. Empty list if processing all records.",
    )
    total_records: Optional[int] = Field(
        None,
        ge=0,
        description="Total number of records to sync for this task. Used for batch sync tasks.",
    )
    synced_records: Optional[int] = Field(
        None,
        ge=0,
        description="Number of records successfully synchronized. Updated during task execution.",
    )
    failed_records: Optional[int] = Field(
        None,
        ge=0,
        description="Number of records that failed to synchronize. Updated during task execution.",
    )
    created_at: datetime = Field(
        ..., description="Task creation timestamp in ISO 8601 format (UTC timezone)."
    )
    updated_at: datetime = Field(
        ...,
        description="Last task update timestamp in ISO 8601 format (UTC timezone). Updated during task execution.",
    )

    class Config:
        from_attributes = True


class RecordStatsOut(BaseModel):
    """Response schema for user record statistics and analytics."""

    total: int = Field(
        ...,
        ge=0,
        description="Total number of problem records for the user. Includes all submissions regardless of status.",
    )
    solved: int = Field(
        ...,
        ge=0,
        description="Number of accepted/solved records. Only includes submissions with 'Accepted' execution result.",
    )
    successRate: float = Field(
        ...,
        ge=0,
        le=100,
        description="Success rate percentage calculated as (solved / total) * 100. Rounded to 1 decimal place.",
    )
    languages: int = Field(
        ...,
        ge=0,
        description="Number of unique programming languages used across all records. Counts distinct language values.",
    )
    unique_problems: int = Field(
        ...,
        ge=0,
        description="Number of unique problems solved. Counts distinct problem titles to avoid duplicates from multiple submissions.",
    )


class RecordDeleteResponse(BaseModel):
    """Response schema for record deletion confirmation."""

    message: str = Field(
        ...,
        max_length=200,
        description="Confirmation message indicating successful deletion of the record.",
    )


class TagAssignRequest(BaseModel):
    """Schema for assigning algorithm tags to a problem record."""

    tag_names: List[str] = Field(
        ...,
        min_items=1,
        max_items=20,
        description="List of tag names to assign to the record. Must contain at least one tag, maximum 20 tags.",
    )


class TagWikiUpdateRequest(BaseModel):
    """Schema for updating tag wiki documentation."""

    wiki: str = Field(
        ...,
        max_length=2000,
        description="New wiki content for the tag. Should include concept explanation, implementation details, and common use cases. Supports markdown formatting.",
    )


class RecordManualCreate(BaseModel):
    """Schema for manual creation of a problem record by user. Only allowed fields are exposed."""

    problem_id: int = Field(..., description="The ID of the problem")
    oj_type: str = Field(..., description="The type of the online judge platform")
    execution_result: str = Field(
        ...,
        description="The result of the solution, e.g., Accepted, Wrong Answer, Time Limit Exceeded, etc.",
    )
    language: str = Field(
        ..., description="The language of the solution, e.g., Python, Java, C++, etc."
    )
    code: Optional[str] = Field(None, description="The code of the solution")
    submit_time: datetime = Field(
        ..., description="The time when the solution was submitted"
    )
    runtime: Optional[str] = Field(
        None, description="The runtime of the solution, e.g., 100ms, 1s, etc."
    )
    memory: Optional[str] = Field(
        None, description="The memory of the solution, e.g., 100MB, 1GB, etc."
    )
    runtime_percentile: Optional[float] = Field(
        None, description="The runtime percentile of the solution, e.g., 50%, 90%, etc."
    )
    memory_percentile: Optional[float] = Field(
        None, description="The memory percentile of the solution, e.g., 50%, 90%, etc."
    )
    total_correct: Optional[int] = Field(
        None, description="The total number of correct submissions"
    )
    total_testcases: Optional[int] = Field(
        None, description="The total number of test cases"
    )
    topic_tags: Optional[List[str]] = Field(None, description="The tags of the problem")

    class Config:
        orm_mode = True
