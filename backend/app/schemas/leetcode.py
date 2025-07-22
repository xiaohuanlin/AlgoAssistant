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


class LeetCodeConfig(BaseModel):
    """LeetCode integration configuration for session management and problem synchronization."""

    session_cookie: Optional[str] = Field(
        None,
        max_length=1000,
        description="LeetCode session cookie for authentication. Required for accessing user-specific data and submissions. Encrypted in storage for security.",
    )
