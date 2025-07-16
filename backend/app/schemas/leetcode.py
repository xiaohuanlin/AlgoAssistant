from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class LeetCodeConnectionTestOut(BaseModel):
    """Response schema for LeetCode connection test with detailed diagnostics."""

    status: str = Field(
        ...,
        max_length=20,
        description="Connection test status indicating success or failure. Values: 'success' for successful connection, 'fail' for connection failure.",
    )
    message: str = Field(
        ...,
        max_length=500,
        description="Detailed connection test message explaining the test result, including any error details or success confirmation.",
    )


class LeetCodeProblemBase(BaseModel):
    """Base model for LeetCode problem data with comprehensive problem information."""

    id: int = Field(
        ...,
        ge=1,
        description="LeetCode problem ID from the platform. Unique identifier for the problem in LeetCode's database.",
    )
    title: str = Field(
        ...,
        max_length=200,
        description="Problem title as displayed on LeetCode. Human-readable name of the algorithm problem.",
    )
    title_slug: str = Field(
        ...,
        max_length=200,
        description="URL-friendly problem title slug. Used in LeetCode URLs and API endpoints. Contains only lowercase letters, numbers, and hyphens.",
    )
    content: Optional[str] = Field(
        None,
        description="Problem description and content including problem statement, examples, constraints, and follow-up questions. May include HTML formatting.",
    )
    difficulty: Optional[str] = Field(
        None,
        max_length=10,
        description="Problem difficulty level. Values: 'Easy', 'Medium', 'Hard'. Used for problem categorization and filtering.",
    )
    topic_tags: Optional[List[str]] = Field(
        None,
        max_items=20,
        description="Algorithm and data structure tags for the problem. Examples: ['Array', 'Hash Table', 'Two Pointers', 'Dynamic Programming']. Maximum 20 tags.",
    )


class LeetCodeProblemCreate(LeetCodeProblemBase):
    """Schema for creating a new LeetCode problem record in the database."""

    pass


class LeetCodeProblemOut(LeetCodeProblemBase):
    """Response schema for LeetCode problem data with timestamps and metadata."""

    created_at: datetime = Field(
        ...,
        description="Problem record creation timestamp in ISO 8601 format (UTC timezone). When the problem was first saved to the database.",
    )
    updated_at: datetime = Field(
        ...,
        description="Last problem record update timestamp in ISO 8601 format (UTC timezone). Updated whenever the problem data is modified.",
    )
    model_config = ConfigDict(from_attributes=True)


class LeetCodeConfig(BaseModel):
    """LeetCode integration configuration for session management and problem synchronization."""

    session_cookie: Optional[str] = Field(
        None,
        max_length=1000,
        description="LeetCode session cookie for authentication. Required for accessing user-specific data and submissions. Encrypted in storage for security.",
    )
