from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


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


class RecordBase(BaseModel):
    """Base record model for problem solving submissions with comprehensive metadata."""

    problem_id: Optional[int] = Field(
        None,
        description="Associated problem ID from the online judge platform. Used for linking with problem metadata.",
    )
    oj_type: OJType = Field(
        ...,
        description="Online Judge platform where the problem was submitted. Supports LeetCode, NowCoder, and other platforms.",
    )
    id: Optional[int] = Field(
        None,
        description="Unique record identifier in the database. Auto-generated sequential integer for tracking submissions.",
    )
    execution_result: str = Field(
        ...,
        max_length=50,
        description="Execution result from the online judge. Common values: 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error'.",
    )
    oj_status: Optional[str] = Field(
        default="pending",
        max_length=20,
        description="Synchronization status with the online judge platform. Values: 'pending', 'syncing', 'synced', 'failed'.",
    )
    language: LanguageType = Field(
        ...,
        description="Programming language used for the solution. Supports Python, Java, C++, JavaScript, TypeScript, Go, Rust, and others.",
    )
    code: str = Field(
        ...,
        max_length=10000,
        description="Complete source code of the solution. Includes all imports, functions, and main logic. Maximum 10,000 characters.",
    )
    submit_time: Optional[datetime] = Field(
        None,
        description="Timestamp when the solution was submitted to the online judge. In ISO 8601 format (UTC timezone).",
    )
    submission_url: Optional[str] = Field(
        None,
        max_length=500,
        description="Direct URL to the submission on the online judge platform. Used for verification and reference.",
    )
    runtime: Optional[str] = Field(
        None,
        max_length=20,
        description="Runtime performance of the solution. Format varies by platform (e.g., '4 ms', '1.2 s', '0.008s').",
    )
    memory: Optional[str] = Field(
        None,
        max_length=20,
        description="Memory usage of the solution. Format varies by platform (e.g., '14.2 MB', '45.6 KB', '38.7MB').",
    )
    runtime_percentile: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Runtime percentile compared to other submissions. Value between 0-100, where higher is better.",
    )
    memory_percentile: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Memory usage percentile compared to other submissions. Value between 0-100, where higher is better.",
    )
    total_correct: Optional[int] = Field(
        None,
        ge=0,
        description="Number of test cases that passed successfully. Must be non-negative integer.",
    )
    total_testcases: Optional[int] = Field(
        None,
        ge=0,
        description="Total number of test cases for the problem. Must be non-negative integer.",
    )
    topic_tags: Optional[List[str]] = Field(
        None,
        max_items=20,
        description="Algorithm and data structure tags for the problem. Examples: ['Array', 'Hash Table', 'Two Pointers', 'Dynamic Programming']. Maximum 20 tags.",
    )


class RecordCreate(RecordBase):
    """Schema for creating a new problem record with validation."""

    pass


class RecordOut(RecordBase):
    """Response schema for record data with additional metadata and synchronization status."""

    user_id: int = Field(
        ...,
        description="User ID who owns this record. Links to the User table for data isolation.",
    )
    problem_id: Optional[int] = Field(
        None,
        description="Associated problem ID from the online judge platform. Used for linking with problem metadata.",
    )
    git_file_path: Optional[str] = Field(
        None,
        max_length=500,
        description="Path to the solution file in the connected Git repository. Format: 'solutions/{platform}/{problem_name}.{extension}'.",
    )
    execution_result: str = Field(
        ...,
        max_length=50,
        description="Execution result from the online judge. Common values: 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error'.",
    )
    ai_analysis: Optional[Dict[str, Any]] = Field(
        None,
        description="AI analysis results including time complexity, space complexity, and improvement suggestions. Generated by OpenAI API.",
    )
    oj_sync_status: Optional[str] = Field(
        None,
        max_length=20,
        description="Online judge synchronization status. Tracks whether the record has been synced back to the platform.",
    )
    github_sync_status: Optional[str] = Field(
        None,
        max_length=20,
        description="GitHub synchronization status. Tracks whether the code has been pushed to the connected repository.",
    )
    ai_analysis_status: Optional[str] = Field(
        None,
        max_length=20,
        description="AI analysis status. Tracks whether the AI analysis has been performed on this record.",
    )
    notion_url: Optional[str] = Field(
        None,
        max_length=500,
        description="URL to the corresponding page in the connected Notion database. Used for knowledge base integration.",
    )
    created_at: datetime = Field(
        ...,
        description="Record creation timestamp in ISO 8601 format (UTC timezone). When the record was first saved to the database.",
    )
    updated_at: datetime = Field(
        ...,
        description="Last record update timestamp in ISO 8601 format (UTC timezone). Updated whenever the record is modified.",
    )

    class Config:
        from_attributes = True


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


class ReviewBase(BaseModel):
    """Base review model for wrong problems tracking and spaced repetition learning."""

    wrong_reason: str = Field(
        ...,
        max_length=1000,
        description="Detailed reason why the problem was marked as wrong. Should include specific mistakes, edge cases missed, or conceptual errors.",
    )
    review_plan: str = Field(
        ...,
        max_length=1000,
        description="Plan for reviewing and improving the solution. Should include specific steps, resources, and timeline for improvement.",
    )


class ReviewCreate(ReviewBase):
    """Schema for creating a new review for wrong problems."""

    pass


class ReviewOut(ReviewBase):
    """Response schema for review data with scheduling and tracking information."""

    id: int = Field(
        ...,
        description="Unique review identifier in the database. Auto-generated sequential integer.",
    )
    user_id: int = Field(
        ...,
        description="User ID who created this review. Links to the User table for data isolation.",
    )
    record_id: int = Field(
        ...,
        description="Associated problem record ID. Links to the Record table for problem context.",
    )
    created_at: datetime = Field(
        ..., description="Review creation timestamp in ISO 8601 format (UTC timezone)."
    )
    updated_at: datetime = Field(
        ...,
        description="Last review update timestamp in ISO 8601 format (UTC timezone).",
    )

    class Config:
        from_attributes = True


class SyncTaskCreate(BaseModel):
    """Schema for creating a new synchronization task for background processing."""

    type: str = Field(
        ...,
        max_length=50,
        description="Task type for synchronization. Valid values: 'github_sync', 'leetcode_batch_sync', 'leetcode_detail_sync', 'notion_sync', 'ai_analysis'.",
    )
    record_ids: Optional[List[int]] = Field(
        None,
        max_items=1000,
        description="List of specific record IDs to process. If not provided, all pending records of the specified type will be processed.",
    )


class SyncTaskQuery(BaseModel):
    """Schema for querying synchronization tasks with filtering options."""

    type: Optional[str] = Field(
        None,
        max_length=50,
        description="Filter by task type. Valid values: 'github_sync', 'leetcode_batch_sync', 'leetcode_detail_sync', 'notion_sync', 'ai_analysis'.",
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
