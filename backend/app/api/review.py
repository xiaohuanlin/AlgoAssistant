from datetime import datetime
from typing import List

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models
from app.deps import get_current_user, get_db
from app.models import User
from app.schemas.review import (
    ReviewBatchUpdate,
    ReviewCreate,
    ReviewFilter,
    ReviewListOut,
    ReviewOut,
    ReviewUpdate,
)
from app.services.review_service import ReviewService

router = APIRouter(prefix="/api/review", tags=["review"])


@router.post("/", response_model=ReviewOut)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new review for a wrong problem."""
    try:
        service = ReviewService(db)
        review = service.mark_as_wrong(
            user_id=current_user.id,
            problem_id=review_data.problem_id,
            wrong_reason=review_data.wrong_reason,
            review_plan=review_data.review_plan,
        )
        return review
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create review: {str(e)}",
        )


@router.get("/", response_model=ReviewListOut)
async def get_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of reviews to return"
    ),
    offset: int = Query(0, ge=0, description="Number of reviews to skip"),
    sort_by: str = Query(
        "created_at",
        description="Sort field: created_at, updated_at, next_review_date, review_count, problem_id",
    ),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
):
    """Get all reviews for the current user, with pagination and sorting."""
    service = ReviewService(db)
    total, reviews = service.get_reviews(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return ReviewListOut(total=total, items=reviews)


@router.get("/due", response_model=List[ReviewOut])
async def get_due_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get reviews that are due for review."""
    try:
        service = ReviewService(db)
        reviews = service.get_due_reviews(user_id=current_user.id)
        return reviews
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get due reviews: {str(e)}",
        )


@router.get("/filter", response_model=ReviewListOut)
async def filter_reviews(
    problem_id: int | None = None,
    problem_title: str | None = None,
    notification_status: str | None = None,
    notification_type: str | None = None,
    min_review_count: int | None = None,
    max_review_count: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of reviews to return"
    ),
    offset: int = Query(0, ge=0, description="Number of reviews to skip"),
    sort_by: str = Query(
        "created_at",
        description="Sort field: created_at, updated_at, next_review_date, review_count, problem_id",
    ),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
):
    """Filter reviews by various fields, with pagination and sorting."""
    service = ReviewService(db)
    filters = {
        "problem_id": problem_id,
        "problem_title": problem_title,
        "notification_status": notification_status,
        "notification_type": notification_type,
        "min_review_count": min_review_count,
        "max_review_count": max_review_count,
        "start_date": start_date,
        "end_date": end_date,
    }
    total, reviews = service.filter_reviews(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_order=sort_order,
        **filters,
    )
    return ReviewListOut(total=total, items=reviews)


@router.post("/batch-update", response_model=List[ReviewOut])
async def batch_update_reviews(
    batch: ReviewBatchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Batch update reviews by IDs."""
    service = ReviewService(db)
    reviews = service.batch_update_reviews(
        user_id=current_user.id, ids=batch.ids, update=batch.update
    )
    return reviews


@router.post("/batch-delete")
async def batch_delete_reviews(
    ids: list[int] = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ReviewService(db)
    count = service.batch_delete_reviews(user_id=current_user.id, ids=ids)
    return {"deleted": count}


@router.post("/batch-mark-reviewed")
async def batch_mark_as_reviewed(
    ids: list[int] = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ReviewService(db)
    count = service.batch_mark_as_reviewed(user_id=current_user.id, ids=ids)
    return {"marked": count}


@router.get("/stats")
async def get_review_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = Query(7, description="Number of days for trend analysis"),
):
    service = ReviewService(db)
    stats = service.get_review_stats(user_id=current_user.id, days=days)
    return stats


@router.get("/{review_id}", response_model=ReviewOut)
async def get_review_detail(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific review by ID for the current user."""
    service = ReviewService(db)
    review = service.get_review_by_id(review_id)
    if not review or review.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@router.post("/{review_id}/mark-reviewed", response_model=ReviewOut)
async def mark_as_reviewed(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a review as completed and schedule next review."""
    try:
        service = ReviewService(db)
        review = service.mark_as_reviewed(review_id=review_id, user_id=current_user.id)
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found",
            )
        return review
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark review as reviewed: {str(e)}",
        )
