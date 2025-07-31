from datetime import datetime
from typing import Dict, List

from sqlalchemy.orm import Session

from app.models import Review, User
from app.schemas.notification import NotificationConfig
from app.services.email_service import EmailService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class NotificationService:
    """Service for sending notifications through multiple channels."""

    def __init__(self, notification_config: NotificationConfig):
        self.notification_config = notification_config
        self.email_service = EmailService(
            getattr(notification_config.email, "settings", None)
        )

    def send_review_notifications(
        self, user: User, reviews: List[Review]
    ) -> Dict[str, bool]:
        """Send review notifications through all configured channels."""
        results = {}

        try:
            # Limit notifications to first 10 reviews to avoid email overload
            limited_reviews = reviews[:10]

            reviews_data = []
            for review in limited_reviews:
                problem = review.problem
                reviews_data.append(
                    {
                        "problem_title": (
                            problem.title if problem else "Unknown Problem"
                        ),
                        "wrong_reason": review.wrong_reason or "Not specified",
                        "review_plan": review.review_plan or "Not specified",
                        "review_id": review.id,
                        "execution_result": "Wrong Answer",  # Default since this is a review
                        "language": "N/A",  # Not available in review model
                    }
                )

            # Add summary info if there are more reviews
            total_reviews = len(reviews)
            if total_reviews > 10:
                reviews_data.append(
                    {
                        "problem_title": f"... and {total_reviews - 10} more problems",
                        "wrong_reason": "Additional problems need review",
                        "review_plan": "Check your review dashboard for all pending items",
                        "review_id": 0,  # Special ID for summary item
                    }
                )

            if (
                self.notification_config.email
                and self.notification_config.email.enabled
            ):
                user_name = user.nickname or user.username
                results["email"] = self.email_service.send_review_reminder(
                    to_email=user.email,
                    user_name=user_name,
                    reviews_data=reviews_data,
                )

            logger.info(f"Review notifications sent to user {user.id}: {results}")
            return results

        except Exception as e:
            logger.exception(
                f"Failed to send review notifications to user {user.id}: {e}"
            )
            return results
