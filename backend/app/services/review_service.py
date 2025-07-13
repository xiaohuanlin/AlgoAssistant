from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from app import models, schemas


class ReviewService:
    """Service for managing wrong problems and review plans."""

    def __init__(self, db: Session):
        self.db = db

    def mark_as_wrong(
        self,
        user_id: int,
        record_id: int,
        wrong_reason: Optional[str] = None,
        review_plan: Optional[str] = None,
    ) -> models.Review:
        """Mark a problem as wrong and create/update review."""
        # Check if review already exists
        existing_review = (
            self.db.query(models.Review)
            .filter(
                models.Review.user_id == user_id, models.Review.record_id == record_id
            )
            .first()
        )

        if existing_review:
            # Update existing review
            existing_review.wrong_reason = wrong_reason
            existing_review.review_plan = review_plan
            self.db.commit()
            self.db.refresh(existing_review)
            return existing_review

        # Create new review
        review = models.Review(
            user_id=user_id,
            record_id=record_id,
            wrong_reason=wrong_reason,
            review_plan=review_plan,
        )
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_reviews(self, user_id: int) -> List[models.Review]:
        """Get all reviews for a user."""
        return (
            self.db.query(models.Review).filter(models.Review.user_id == user_id).all()
        )

    def get_due_reviews(self, user_id: int) -> List[models.Review]:
        """Get reviews that are due for review."""
        now = datetime.utcnow()
        return (
            self.db.query(models.Review)
            .filter(
                models.Review.user_id == user_id, models.Review.next_review_date <= now
            )
            .all()
        )

    def mark_as_reviewed(self, review_id: int, user_id: int) -> models.Review:
        """Mark a review as completed and schedule next review."""
        review = (
            self.db.query(models.Review)
            .filter(models.Review.id == review_id, models.Review.user_id == user_id)
            .first()
        )
        if not review:
            return None
        review.review_count += 1
        review.next_review_date = self._calculate_next_review_date(review.review_count)
        self.db.commit()
        self.db.refresh(review)
        return review

    def _calculate_next_review_date(self, review_count: int) -> datetime:
        """Calculate next review date based on memory curve (Ebbinghaus forgetting curve)."""
        # Simple implementation: 1 day, 3 days, 7 days, 14 days, 30 days
        intervals = [1, 3, 7, 14, 30]
        days = intervals[min(review_count, len(intervals) - 1)]
        return datetime.utcnow() + timedelta(days=days)
