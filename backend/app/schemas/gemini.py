from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class GeminiConfig(BaseModel):
    """Gemini AI service configuration for code analysis using GooglesGemini model."""

    api_key: Optional[str] = Field(
        None,
        max_length=1000,
        description="Google Gemini API key for AI analysis services. Required for code complexity analysis, improvement suggestions, and automated code review. Encrypted in storage for security.",
    )
    model_name: str = Field(
        default="gemini-2.0-flash-1",
        max_length=100,
        description="Gemini model name to use for analysis. Defaults to gemini-2sh-001 for optimal performance and cost.",
    )


class ConnectionTestResponse(BaseModel):
    status: str = Field(..., description="Connection test status: success or failed")
    message: str = Field(..., description="Connection test result message")
    model: Optional[str] = Field(None, description="Gemini model name if connected")


class AIAnalysisStatus(str, Enum):
    """AI analysis status enumeration."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class CodeComplexity(str, Enum):
    """complexity levels."""

    O1 = "O(1)"
    OLOG_N = "O(log n)"
    ON = "O(n)"
    ON_LOG_N = "O(n log n)"
    ON2 = "O(n²)"
    ON3 = "O(n³)"
    O2N = "O(2n)"
    ON_FACTORIAL = "O(n!)"


class AIAnalysisResult(BaseModel):
    """AI analysis result for code analysis with comprehensive insights."""

    # Basic analysis
    summary: str = Field(
        ...,
        max_length=2000,
        description="Brief summary of the solution approach and key insights.",
    )
    # Complexity analysis
    time_complexity: CodeComplexity = Field(
        ...,
        description="Time complexity of the solution algorithm.",
    )
    space_complexity: CodeComplexity = Field(
        ...,
        description="Space complexity of the solution algorithm.",
    )
    # Algorithm identification
    algorithm_type: str = Field(
        ...,
        max_length=100,
        description="Primary algorithm type used in the solution (e.g.,Two Pointers', 'Dynamic Programming').",
    )

    # Code quality metrics
    code_quality_score: int = Field(
        ...,
        ge=1,
        le=10,
        description="Code quality score from 1-10 based on readability, efficiency, and best practices.",
    )
    # Detailed analysis
    step_analysis: List[str] = Field(
        ...,
        max_items=20,
        description="Step-by-step analysis of the solution approach.",
    )

    # Error analysis (if applicable)
    error_reason: Optional[str] = Field(
        None,
        max_length=1000,
        description="Analysis of why the solution might have failed (if execution_result is notAccepted').",
    )
    # Improvement suggestions
    improvement_suggestions: List[str] = Field(
        default=[],
        max_items=10,
        description="List of suggestions for improving the solution.",
    )
    # Related problems
    related_problems: List[str] = Field(
        default=[],
        max_items=10,
        description="List of related problem numbers for further practice.",
    )
    # Performance insights
    performance_insights: Optional[str] = Field(
        None,
        max_length=1000,
        description="Insights about the solution's performance characteristics.",
    )

    # Code patterns
    code_patterns: List[str] = Field(
        default=[],
        max_items=10,
        description="Identified code patterns and techniques used in the solution.",
    )
    # Learning points
    learning_points: List[str] = Field(
        default=[],
        max_items=10,
        description="Key learning points from this solution.",
    )


class AIAnalysisStatsResponse(BaseModel):
    """Response model for AI analysis statistics."""

    total_records: int = Field(
        ...,
        description="Total number of records.",
    )

    analyzed_records: int = Field(
        ...,
        description="Number of records that have been analyzed.",
    )

    pending_records: int = Field(
        ...,
        description="Number of records pending analysis.",
    )

    failed_records: int = Field(
        ...,
        description="Number of records with failed analysis.",
    )

    analysis_coverage: float = Field(
        ...,
        ge=0,
        le=100,
        description="Percentage of records that have been analyzed.",
    )


class GeminiAIAnalysisSchema(BaseModel):
    summary: str = Field(..., description="Brief overview of the solution's approach")
    solution_types: List[str] = Field(
        ..., description="Types of the solution, e.g., DFS, DP, Greedy, etc."
    )
    time_complexity: str = Field(
        ..., description="Time complexity in Big-O notation, e.g., O(n log n)"
    )
    space_complexity: str = Field(..., description="Space complexity in Big-O notation")
    algorithm_type: str = Field(
        ..., description="Main algorithm category, e.g., DFS, DP"
    )
    topic_tags: List[str] = Field(
        ..., description="List of relevant algorithmic topic tags for this problem"
    )
    code_quality_score: int = Field(
        ..., ge=1, le=10, description="Overall code quality rating"
    )
    style_score: int = Field(
        ..., ge=1, le=10, description="Code readability and formatting rating"
    )
    correctness_confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Estimated correctness confidence"
    )
    step_analysis: List[str] = Field(
        ..., description="Step-by-step breakdown of the code logic"
    )
    improvement_suggestions: str = Field(
        ..., description="Suggestions for improvement or optimization"
    )
    edge_cases_covered: List[str] = Field(
        ..., description="Mentioned edge cases handled in the solution"
    )
    related_problems: List[str] = Field(
        ..., description="List of similar problems or variants"
    )
    risk_areas: List[str] = Field(
        ..., description="Parts of the code that may be error-prone or complex"
    )
    learning_points: List[str] = Field(
        ..., description="Takeaways or lessons from this solution"
    )
    model_version: str = Field(..., description="Model version used for analysis")
