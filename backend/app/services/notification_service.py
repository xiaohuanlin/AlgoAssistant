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
            reviews_data = []
            for review in reviews:
                problem = review.problem
                reviews_data.append(
                    {
                        "problem_title": problem.title
                        if problem
                        else "Unknown Problem",
                        "wrong_reason": review.wrong_reason,
                        "review_plan": review.review_plan,
                        "review_id": review.id,
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
