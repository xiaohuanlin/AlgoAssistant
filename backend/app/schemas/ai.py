from typing import Optional

from pydantic import BaseModel, Field


class AIConfig(BaseModel):
    """AI service configuration for code analysis and improvement suggestions using OpenAI API."""

    openai_key: Optional[str] = Field(
        None,
        max_length=1000,
        description="OpenAI API key for AI analysis services. Required for code complexity analysis, improvement suggestions, and automated code review. Encrypted in storage for security.",
    )
