from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field
from app.schemas.record import RecordListOut


class ReviewBase(BaseModel):
    problem_id: int = Field(..., description="Problem id")
    wrong_reason: Optional[str] = Field(None, description="Why the problem was wrong")
    review_plan: Optional[str] = Field(None, description="Review plan or notes")
    next_review_date: Optional[datetime] = Field(
        None, description="Next review date based on memory curve"
    )
    review_count: Optional[int] = Field(0, description="Number of times reviewed")


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    wrong_reason: Optional[str] = Field(None, description="Why the problem was wrong")
    review_plan: Optional[str] = Field(None, description="Review plan or notes")
    next_review_date: Optional[datetime] = Field(
        None, description="Next review date based on memory curve"
    )
    review_count: Optional[int] = Field(None, description="Number of times reviewed")
    notification_sent: Optional[bool] = Field(
        None, description="Whether notification has been sent"
    )
    notification_sent_at: Optional[datetime] = Field(
        None, description="When notification was sent"
    )
    notification_type: Optional[str] = Field(
        None, description="Notification type: email, push, sms, etc."
    )
    notification_status: Optional[str] = Field(
        None, description="Notification status: pending, sent, failed"
    )


class ReviewOut(ReviewBase):
    id: int
    user_id: int
    problem_id: int
    problem_title: Optional[str] = Field(None, description="Title of the problem")
    notification_sent: bool
    notification_sent_at: Optional[datetime]
    notification_type: str
    notification_status: str
    created_at: datetime
    updated_at: datetime
    submissions: Optional[List[RecordListOut]] = Field(None, description="All submissions for this problem by the user")

    class Config:
        orm_mode = True
        from_attributes = True


class ReviewFilter(BaseModel):
    problem_id: Optional[int] = None
    notification_status: Optional[str] = None
    notification_type: Optional[str] = None
    min_review_count: Optional[int] = None
    max_review_count: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ReviewBatchUpdate(BaseModel):
    ids: list[int] = Field(..., description="Review ID list")
    update: ReviewUpdate = Field(..., description="Update fields for batch operation")


class ReviewListOut(BaseModel):
    total: int
    items: List[ReviewOut]
