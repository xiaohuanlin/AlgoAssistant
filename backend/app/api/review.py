from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas import ReviewCreate, ReviewOut
from app.services.review_service import ReviewService
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/api/review", tags=["review"])

# Placeholder for review/reminder endpoints
# Future: review wrong problems, reminders, etc. 

@router.post("/mark/{record_id}", response_model=ReviewOut)
def mark_as_wrong(
    record_id: int,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ReviewService(db)
    review = service.mark_as_wrong(current_user.id, record_id, review_data.wrong_reason, review_data.review_plan)
    return review

@router.get("/list", response_model=List[ReviewOut])
def list_reviews(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ReviewService(db)
    reviews = service.get_reviews(current_user.id)
    return reviews

@router.get("/due", response_model=List[ReviewOut])
def get_due_reviews(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ReviewService(db)
    reviews = service.get_due_reviews(current_user.id)
    return reviews

@router.post("/{review_id}/complete", response_model=ReviewOut)
def mark_as_reviewed(
    review_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ReviewService(db)
    review = service.mark_as_reviewed(review_id, current_user.id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review 