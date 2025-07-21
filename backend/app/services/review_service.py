from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from app import models, schemas
from app.schemas.review import ReviewUpdate


class ReviewService:
    """Service for managing wrong problems and review plans."""

    def __init__(self, db: Session):
        self.db = db

    def mark_as_wrong(
        self,
        user_id: int,
        problem_id: int,
        wrong_reason: Optional[str] = None,
        review_plan: Optional[str] = None,
    ) -> models.Review:
        """Mark a problem as wrong and create/update review."""
        # Check if review already exists
        existing_review = (
            self.db.query(models.Review)
            .filter(
                models.Review.user_id == user_id, models.Review.problem_id == problem_id
            )
            .first()
        )

        if existing_review:
            existing_review.wrong_reason = wrong_reason
            existing_review.review_plan = review_plan
            self.db.commit()
            self.db.refresh(existing_review)
            return existing_review

        review = models.Review(
            user_id=user_id,
            problem_id=problem_id,
            wrong_reason=wrong_reason,
            review_plan=review_plan,
        )
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_reviews(
        self,
        user_id: int,
        limit: int = 100,
        offset: int = 0,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> (int, list[models.Review]):
        """Get all reviews for a user, with pagination and sorting."""
        query = self.db.query(models.Review).filter(models.Review.user_id == user_id)
        valid_sort_fields = [
            "created_at",
            "updated_at",
            "next_review_date",
            "review_count",
            "problem_id",
        ]
        if sort_by not in valid_sort_fields:
            sort_by = "created_at"
        sort_column = getattr(models.Review, sort_by)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc().nullslast())
        else:
            query = query.order_by(sort_column.desc().nullslast())
        total = query.count()
        reviews = query.offset(offset).limit(limit).all()
        return total, reviews

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

    def get_review_by_id(self, review_id: int) -> models.Review:
        """Get a single review by its ID."""
        return (
            self.db.query(models.Review).filter(models.Review.id == review_id).first()
        )

    def filter_reviews(
        self,
        user_id: int,
        limit: int = 100,
        offset: int = 0,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        **filters
    ) -> (int, list[models.Review]):
        """Filter reviews by various fields, with pagination and sorting."""
        query = self.db.query(models.Review).filter(models.Review.user_id == user_id)
        if filters.get("problem_id"):
            query = query.filter(models.Review.problem_id == filters["problem_id"])
        if filters.get("notification_status"):
            query = query.filter(
                models.Review.notification_status == filters["notification_status"]
            )
        if filters.get("notification_type"):
            query = query.filter(
                models.Review.notification_type == filters["notification_type"]
            )
        if filters.get("min_review_count") is not None:
            query = query.filter(
                models.Review.review_count >= filters["min_review_count"]
            )
        if filters.get("max_review_count") is not None:
            query = query.filter(
                models.Review.review_count <= filters["max_review_count"]
            )
        if filters.get("start_date"):
            try:
                start_dt = datetime.fromisoformat(filters["start_date"])
                query = query.filter(models.Review.next_review_date >= start_dt)
            except Exception:
                pass
        if filters.get("end_date"):
            try:
                end_dt = datetime.fromisoformat(filters["end_date"])
                query = query.filter(models.Review.next_review_date <= end_dt)
            except Exception:
                pass
        valid_sort_fields = [
            "created_at",
            "updated_at",
            "next_review_date",
            "review_count",
            "problem_id",
        ]
        if sort_by not in valid_sort_fields:
            sort_by = "created_at"
        sort_column = getattr(models.Review, sort_by)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc().nullslast())
        else:
            query = query.order_by(sort_column.desc().nullslast())
        total = query.count()
        reviews = query.offset(offset).limit(limit).all()
        return total, reviews

    def batch_update_reviews(
        self, user_id: int, ids: list[int], update: ReviewUpdate
    ) -> List[models.Review]:
        reviews = (
            self.db.query(models.Review)
            .filter(models.Review.user_id == user_id, models.Review.id.in_(ids))
            .all()
        )
        for review in reviews:
            for field, value in update.dict(exclude_unset=True).items():
                setattr(review, field, value)
        self.db.commit()
        for review in reviews:
            self.db.refresh(review)
        return reviews

    def batch_delete_reviews(self, user_id: int, ids: list[int]) -> int:
        query = self.db.query(models.Review).filter(
            models.Review.user_id == user_id, models.Review.id.in_(ids)
        )
        count = query.count()
        query.delete(synchronize_session=False)
        self.db.commit()
        return count

    def batch_mark_as_reviewed(self, user_id: int, ids: list[int]) -> int:
        reviews = (
            self.db.query(models.Review)
            .filter(models.Review.user_id == user_id, models.Review.id.in_(ids))
            .all()
        )
        for review in reviews:
            review.review_count += 1
            review.next_review_date = self._calculate_next_review_date(
                review.review_count
            )
        self.db.commit()
        return len(reviews)

    def _calculate_next_review_date(self, review_count: int) -> datetime:
        """Calculate next review date based on memory curve (Ebbinghaus forgetting curve)."""
        # Simple implementation: 1 day, 3 days, 7 days, 14 days, 30 days
        intervals = [1, 3, 7, 14, 30]
        days = intervals[min(review_count, len(intervals) - 1)]
        return datetime.utcnow() + timedelta(days=days)
