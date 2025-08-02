from datetime import datetime, timedelta
from typing import List

from celery import shared_task

from app.deps import get_db
from app.models import Problem, Review, User, UserConfig
from app.services.notification_service import NotificationService
from app.utils.logger import get_logger

logger = get_logger(__name__)


@shared_task
def check_due_reviews():
    """Check for due reviews and send notifications."""
    logger.info("Starting due reviews check")

    try:
        db = next(get_db())
        # Get all due reviews (next_review_date <= now and notification not sent)
        now = datetime.utcnow()
        due_reviews: List[Review] = (
            db.query(Review)
            .join(Problem)  # Join with Problem table
            .filter(
                Review.next_review_date <= now,
                Review.notification_sent == False,  # noqa: E712
            )
            .all()
        )

        if not due_reviews:
            logger.info("No due reviews found")
            return

        logger.info(f"Found {len(due_reviews)} due reviews")

        # Group reviews by user
        reviews_by_user = {}
        for review in due_reviews:
            if review.user_id not in reviews_by_user:
                reviews_by_user[review.user_id] = []
            reviews_by_user[review.user_id].append(review)

        # Statistics
        total_users = len(reviews_by_user)
        successful_users = 0
        failed_users = 0
        total_reviews = len(due_reviews)
        successful_reviews = 0
        failed_reviews = 0

        # Send notifications for each user
        for user_id, reviews in reviews_by_user.items():
            try:
                user: User | None = db.query(User).filter(User.id == user_id).first()
                if not user or not user.configs or not user.configs.notification_config:
                    continue

                notification_service = NotificationService(
                    user.configs.notification_config
                )
                results = notification_service.send_review_notifications(user, reviews)

                if any(results.values()):
                    # Update notification status for successful notifications
                    for review in reviews:
                        review.notification_sent = True
                        review.notification_sent_at = datetime.utcnow()
                        review.notification_status = "sent"
                        # Set notification type based on successful channels
                        successful_channels = [k for k, v in results.items() if v]
                        review.notification_type = ",".join(successful_channels)

                    db.commit()
                    successful_users += 1
                    successful_reviews += len(reviews)
                    logger.info(f"Notifications sent to user {user_id}: {results}")
                else:
                    # Update notification status for failed notifications
                    for review in reviews:
                        review.notification_status = "failed"
                    db.commit()
                    failed_users += 1
                    failed_reviews += len(reviews)
                    logger.warning(f"Failed to send notifications to user {user_id}")

            except Exception as e:
                failed_users += 1
                failed_reviews += len(reviews)
                logger.exception(f"Failed to send notifications to user {user_id}: {e}")

        # Log statistics
        logger.info("Review notification task completed:")
        logger.info(f"  Total users: {total_users}")
        logger.info(f"  Successful users: {successful_users}")
        logger.info(f"  Failed users: {failed_users}")
        logger.info(f"  Total reviews: {total_reviews}")
        logger.info(f"  Successful reviews: {successful_reviews}")
        logger.info(f"  Failed reviews: {failed_reviews}")

    except Exception as e:
        logger.exception(f"Failed to check due reviews: {e}")
    finally:
        db.close()
