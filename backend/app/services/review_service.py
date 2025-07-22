from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import tuple_
from sqlalchemy.exc import IntegrityError
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
        next_review_date: Optional[datetime] = None,
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
            if next_review_date:
                existing_review.next_review_date = next_review_date
            self.db.commit()
            self.db.refresh(existing_review)
            return existing_review

        review = models.Review(
            user_id=user_id,
            problem_id=problem_id,
            wrong_reason=wrong_reason,
            review_plan=review_plan,
            next_review_date=next_review_date or self._calculate_next_review_date(0),
        )
        self.db.add(review)
        try:
            self.db.commit()
            self.db.refresh(review)
            return review
        except IntegrityError:
            self.db.rollback()
            existing_review = (
                self.db.query(models.Review)
                .filter(
                    models.Review.user_id == user_id,
                    models.Review.problem_id == problem_id,
                )
                .first()
            )
            return existing_review

    def get_reviews(
        self,
        user_id: int,
        limit: int = 100,
        offset: int = 0,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> (int, list[schemas.ReviewOut]):
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
        return total, [self.to_review_out(r) for r in reviews]

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

    def mark_as_reviewed(
        self, review_id: int, user_id: int, next_review_date: Optional[datetime] = None
    ) -> models.Review:
        """Mark a review as completed and schedule next review."""
        review = (
            self.db.query(models.Review)
            .filter(models.Review.id == review_id, models.Review.user_id == user_id)
            .first()
        )
        if not review:
            return None
        review.review_count += 1
        if next_review_date:
            review.next_review_date = next_review_date
        else:
            review.next_review_date = self._calculate_next_review_date(
                review.review_count
            )
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_review_by_id(self, review_id: int) -> schemas.ReviewOut:
        """Get a single review by its ID."""
        review = (
            self.db.query(models.Review).filter(models.Review.id == review_id).first()
        )
        if not review:
            return None
        return self.to_review_out(review)

    def filter_reviews(
        self,
        user_id: int,
        limit: int = 100,
        offset: int = 0,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        **filters,
    ) -> (int, list[schemas.ReviewOut]):
        """Filter reviews by various fields, with pagination and sorting."""
        query = self.db.query(models.Review).filter(models.Review.user_id == user_id)
        if filters.get("problem_id"):
            query = query.filter(models.Review.problem_id == filters["problem_id"])
        if filters.get("problem_title"):
            query = query.filter(
                models.Review.problem.has(
                    models.Problem.title.ilike(f"%{filters['problem_title']}%")
                )
            )
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
            query = query.filter(
                models.Review.next_review_date >= filters["start_date"]
            )
        if filters.get("end_date"):
            query = query.filter(models.Review.next_review_date <= filters["end_date"])
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
        return total, [self.to_review_out(r) for r in reviews]

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

    def bulk_mark_as_wrong(self, records: List[models.Record]) -> List[dict]:
        # Filter out accepted records and records without user_id/problem_id
        wrong_records = [
            r
            for r in records
            if r.execution_result != "Accepted" and r.user_id and r.problem_id
        ]
        # Deduplicate by (user_id, problem_id)
        unique_keys = set()
        unique_records = []
        for r in wrong_records:
            key = (r.user_id, r.problem_id)
            if key not in unique_keys:
                unique_keys.add(key)
                unique_records.append(r)
        if not unique_records:
            return []
        # Query existing reviews in one go
        existing = (
            self.db.query(models.Review)
            .filter(
                tuple_(models.Review.user_id, models.Review.problem_id).in_(
                    [(r.user_id, r.problem_id) for r in unique_records]
                )
            )
            .all()
        )
        existing_keys = set((r.user_id, r.problem_id) for r in existing)
        # Prepare new reviews to insert
        to_create = [
            models.Review(
                user_id=r.user_id,
                problem_id=r.problem_id,
                wrong_reason=getattr(r, "ai_analysis", "Auto generated by batch"),
                review_plan=None,
            )
            for r in unique_records
            if (r.user_id, r.problem_id) not in existing_keys
        ]
        # Bulk insert
        result = []
        if to_create:
            self.db.bulk_save_objects(to_create)
            self.db.commit()
            for r in to_create:
                result.append(
                    {
                        "user_id": r.user_id,
                        "problem_id": r.problem_id,
                        "status": "created",
                    }
                )
        # Add already existing
        for r in unique_records:
            if (r.user_id, r.problem_id) in existing_keys:
                result.append(
                    {
                        "user_id": r.user_id,
                        "problem_id": r.problem_id,
                        "status": "exists",
                    }
                )
        return result

    def get_review_stats(self, user_id: int, days: int = 7) -> dict:
        from datetime import date

        today = date.today()
        total = (
            self.db.query(models.Review)
            .filter(models.Review.user_id == user_id)
            .count()
        )
        from_date = today - timedelta(days=days)
        new_this_week = (
            self.db.query(models.Review)
            .filter(
                models.Review.user_id == user_id, models.Review.created_at >= from_date
            )
            .count()
        )
        completed = (
            self.db.query(models.Review)
            .filter(models.Review.user_id == user_id, models.Review.review_count > 0)
            .count()
        )
        pending = (
            self.db.query(models.Review)
            .filter(models.Review.user_id == user_id, models.Review.review_count == 0)
            .count()
        )
        overdue = (
            self.db.query(models.Review)
            .filter(
                models.Review.user_id == user_id,
                models.Review.next_review_date < datetime.utcnow(),
            )
            .count()
        )
        completion_rate = completed / total if total else 0.0
        trend = []
        for i in range(days):
            day = today - timedelta(days=days - i - 1)
            next_day = day + timedelta(days=1)
            count = (
                self.db.query(models.Review)
                .filter(
                    models.Review.user_id == user_id,
                    models.Review.created_at >= day,
                    models.Review.created_at < next_day,
                )
                .count()
            )
            trend.append({"date": str(day), "count": count})
        return {
            "total": total,
            "new_this_week": new_this_week,
            "completed": completed,
            "pending": pending,
            "overdue": overdue,
            "completion_rate": round(completion_rate, 2),
            "trend": trend,
        }

    def _calculate_next_review_date(self, review_count: int) -> datetime:
        """Calculate next review date based on memory curve (Ebbinghaus forgetting curve)."""
        # Improved memory curve: 1, 2, 4, 7, 15, 30, 60, 120 days
        intervals = [1, 2, 4, 7, 15, 30, 60, 120]
        days = intervals[min(review_count, len(intervals) - 1)]
        return datetime.utcnow() + timedelta(days=days)

    def to_review_out(self, review: models.Review) -> schemas.ReviewOut:
        return schemas.ReviewOut.model_validate(
            {
                **review.__dict__,
                "problem_title": review.problem.title,
                "problem_id": review.problem.id,
            }
        )
