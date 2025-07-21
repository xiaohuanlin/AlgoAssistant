from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

from app.models import LeetCodeProblem, Record, Review, User, UserConfig
from app.services.email_service import EmailService
from app.services.notification_service import NotificationService
from app.tasks.review_notification import (
    check_due_reviews,
    send_review_reminder_for_user,
)


class TestNotificationService:
    """Test notification service functionality."""

    @patch("app.services.email_service.EmailService.send_review_reminder")
    def test_send_review_notifications_with_config(self, mock_send_email, db_session):
        """Test sending review notifications with config."""
        # Create test user and config
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create test problem and record
        problem = LeetCodeProblem(
            title="Two Sum", title_slug="two-sum", difficulty="Easy"
        )
        db_session.add(problem)
        db_session.commit()

        record = Record(
            user_id=user.id,
            problem_id=problem.id,
            execution_result="Wrong Answer",
            language="python",
            submission_id=123,
        )
        db_session.add(record)
        db_session.commit()

        # Create test review
        review = Review(
            user_id=user.id,
            record_id=record.id,
            wrong_reason="Wrong approach",
            review_plan="Review the problem again",
        )
        db_session.add(review)
        db_session.commit()

        notification_config = {
            "email": {
                "enabled": True,
                "settings": {"email": "test@example.com"},
                "frequency": "daily",
            }
        }

        # Mock email service
        mock_send_email.return_value = True

        notification_service = NotificationService(db_session)
        results = notification_service.send_review_notifications(
            user.id, [review], notification_config
        )

        assert "email" in results
        assert results["email"] is True
        mock_send_email.assert_called_once()


class TestEmailService:
    """Test email service functionality."""

    @patch("app.services.email_service.smtplib.SMTP")
    def test_send_email_success(self, mock_smtp, db_session):
        """Test successful email sending."""
        # Mock SMTP
        mock_smtp_instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_smtp_instance

        # Test data
        to_email = "test@example.com"
        user_name = "TestUser"
        reviews_data = [
            {
                "problem_title": "Two Sum",
                "execution_result": "Wrong Answer",
                "language": "python",
                "wrong_reason": "Wrong approach",
                "review_plan": "Review the problem again",
                "review_id": 1,
            }
        ]
        smtp_settings = {"email": "test@example.com", "password": "password123"}

        email_service = EmailService()
        success = email_service.send_review_reminder(
            to_email, user_name, reviews_data, smtp_settings
        )

        assert success is True
        mock_smtp_instance.starttls.assert_called_once()
        mock_smtp_instance.login.assert_called_once()
        mock_smtp_instance.send_message.assert_called_once()

    def test_send_email_no_config(self, db_session):
        """Test email sending when user has no config."""
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        email_service = EmailService(db_session)
        success = email_service.send_review_reminder(user.id, [])

        assert success is False


class TestReviewNotificationTasks:
    """Test review notification tasks."""

    @patch("app.tasks.review_notification.NotificationService")
    def test_check_due_reviews(self, mock_notification_service, db_session):
        """Test check_due_reviews task."""
        # Create test user
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create test problem and record
        problem = LeetCodeProblem(
            title="Two Sum", title_slug="two-sum", difficulty="Easy"
        )
        db_session.add(problem)
        db_session.commit()

        record = Record(
            user_id=user.id,
            problem_id=problem.id,
            execution_result="Wrong Answer",
            language="python",
            submission_id=123,
        )
        db_session.add(record)
        db_session.commit()

        # Create due review
        due_review = Review(
            user_id=user.id,
            record_id=record.id,
            next_review_date=datetime.utcnow() - timedelta(hours=1),
            notification_sent=False,
        )
        db_session.add(due_review)
        db_session.commit()

        # Create user config
        from app.models import UserConfig

        user_config = UserConfig(
            user_id=user.id,
            notification_config={
                "email": {
                    "enabled": True,
                    "settings": {"email": "test@example.com"},
                    "frequency": "daily",
                }
            },
        )
        db_session.add(user_config)
        db_session.commit()

        # Mock notification service
        mock_service_instance = MagicMock()
        mock_service_instance.send_review_notifications.return_value = {"email": True}
        mock_notification_service.return_value = mock_service_instance

        # Test the task
        with patch("app.tasks.review_notification.get_db") as mock_get_db:
            mock_get_db.return_value = iter([db_session])
            check_due_reviews()

            # Verify notification service was called
            mock_service_instance.send_review_notifications.assert_called_once()

    @patch("app.tasks.review_notification.NotificationService")
    def test_send_review_reminder_for_user(self, mock_notification_service, db_session):
        """Test send_review_reminder_for_user task."""
        # Create test user
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Mock notification service
        mock_service_instance = MagicMock()
        mock_service_instance.send_review_notifications.return_value = {"email": True}
        mock_notification_service.return_value = mock_service_instance

        # Test the task
        with patch("app.tasks.review_notification.get_db") as mock_get_db:
            mock_get_db.return_value = iter([db_session])
            send_review_reminder_for_user(user.id)

            # Verify notification service was called
            mock_service_instance.send_review_notifications.assert_called_once_with(
                user.id, []
            )


class TestReviewCandidatesAPI:
    """Test review candidates API."""

    def test_get_review_candidates_success(self, client, db_session):
        """Test successful review candidates retrieval."""
        # Create test user
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create test problem
        problem = LeetCodeProblem(
            title="Two Sum", title_slug="two-sum", difficulty="Easy"
        )
        db_session.add(problem)
        db_session.commit()

        # Create test records
        record1 = Record(
            user_id=user.id,
            problem_id=problem.id,
            execution_result="Wrong Answer",
            language="python",
            submission_id=123,
        )
        record2 = Record(
            user_id=user.id,
            problem_id=problem.id,
            execution_result="Accepted",
            language="python",
            submission_id=124,
        )
        db_session.add_all([record1, record2])
        db_session.commit()

        # Create sync task
        from app.models import SyncStatus, SyncTask

        sync_task = SyncTask(
            user_id=user.id,
            status=SyncStatus.COMPLETED.value,
            record_ids=[record1.id, record2.id],
            type="leetcode_sync",
        )
        db_session.add(sync_task)
        db_session.commit()

        # Test API
        response = client.get(f"/api/sync_task/{sync_task.id}/review-candidates")
        assert response.status_code == 200

        data = response.json()
        assert data["task_id"] == sync_task.id
        assert len(data["candidates"]) == 1  # Only Wrong Answer record
        assert data["candidates"][0]["record_id"] == record1.id
        assert data["candidates"][0]["execution_result"] == "Wrong Answer"

    def test_get_review_candidates_task_not_found(self, client):
        """Test review candidates API when task not found."""
        response = client.get("/api/sync_task/999/review-candidates")
        assert response.status_code == 404

    def test_get_review_candidates_task_not_completed(self, client, db_session):
        """Test review candidates API when task not completed."""
        # Create test user
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
        )
        db_session.add(user)
        db_session.commit()

        # Create sync task with pending status
        from app.models import SyncStatus, SyncTask

        sync_task = SyncTask(
            user_id=user.id,
            status=SyncStatus.PENDING.value,
            record_ids=[],
            type="leetcode_sync",
        )
        db_session.add(sync_task)
        db_session.commit()

        # Test API
        response = client.get(f"/api/sync_task/{sync_task.id}/review-candidates")
        assert response.status_code == 400
        assert "must be completed" in response.json()["detail"]
