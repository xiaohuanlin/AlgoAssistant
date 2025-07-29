from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.record import RecordListOut
from app.schemas.review import ReviewOut


class ProblemSource(str, Enum):
    leetcode = "leetcode"
    custom = "custom"


class ProblemBase(BaseModel):
    source: ProblemSource = Field(
        ..., description="Problem source, e.g. leetcode/custom"
    )
    source_id: Optional[str] = Field(None, description="Source platform problem id")
    title: Optional[str] = Field(None, description="Problem title")
    title_slug: Optional[str] = Field(None, description="URL-friendly title slug")
    difficulty: Optional[str] = Field(None, description="Difficulty level")
    tags: Optional[List[str]] = Field(None, description="Tags for the problem")
    description: Optional[str] = Field(None, description="Problem description")
    url: Optional[str] = Field(None, description="Problem URL")


class ProblemCreate(ProblemBase):
    pass


class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    title_slug: Optional[str] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    url: Optional[str] = None


class ProblemBatchCreate(BaseModel):
    problems: List[ProblemCreate] = Field(
        ..., description="List of problems to import in batch"
    )


class ProblemOut(ProblemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class ProblemUserRecordsOut(BaseModel):
    records: List[RecordListOut]
    reviews: List[ReviewOut]


class ProblemListOut(BaseModel):
    total: int
    items: List[ProblemOut]


class ProblemBankStatsOut(BaseModel):
    total_problems: int = Field(..., description="Total number of problems")
    easy_problems: int = Field(..., description="Number of easy problems")
    medium_problems: int = Field(..., description="Number of medium problems")
    hard_problems: int = Field(..., description="Number of hard problems")
    leetcode_problems: int = Field(..., description="Number of LeetCode problems")
    custom_problems: int = Field(..., description="Number of custom problems")
    solved_problems: int = Field(..., description="Number of problems user has solved")
    total_attempts: int = Field(..., description="Total attempts by user")
    solve_rate: float = Field(..., description="User's solve rate (0.0 to 1.0)")
    total_reviews: int = Field(..., description="Total reviews by user")


class ProblemStatisticsOut(BaseModel):
    total_attempts: int = Field(..., description="Total attempts for this problem")
    successful_attempts: int = Field(..., description="Number of successful attempts")
    success_rate: float = Field(..., description="Success rate (0.0 to 1.0)")
    best_time: Optional[str] = Field(None, description="Best runtime")
    best_memory: Optional[str] = Field(None, description="Best memory usage")
    total_reviews: int = Field(..., description="Total reviews for this problem")
    last_attempt_date: Optional[datetime] = Field(
        None, description="Date of last attempt"
    )
