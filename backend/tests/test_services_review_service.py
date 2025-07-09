import pytest
from unittest.mock import patch, MagicMock
from app.services.review_service import ReviewService
from app.models import User, Record, Review
from datetime import datetime, timedelta

class TestReviewService:
    """Test ReviewService functionality."""
    
    def test_mark_as_wrong(self, db_session):
        """Test marking a problem as wrong."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Create record
        record = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_id="1",
            problem_title="Two Sum",
            status="wrong_answer",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        db_session.add(record)
        db_session.commit()
        
        service = ReviewService(db_session)
        review = service.mark_as_wrong(
            user.id, 
            record.id, 
            wrong_reason="Didn't consider edge case",
            review_plan="Review two pointers technique"
        )
        
        assert review.id is not None
        assert review.user_id == user.id
        assert review.record_id == record.id
        assert review.wrong_reason == "Didn't consider edge case"
        assert review.review_plan == "Review two pointers technique"
        assert review.review_count == 0
        assert review.next_review_date is not None
    
    def test_mark_as_wrong_existing_review(self, db_session):
        """Test marking a problem as wrong when review already exists."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Create record
        record = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_id="1",
            problem_title="Two Sum",
            status="wrong_answer",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        db_session.add(record)
        db_session.commit()
        
        service = ReviewService(db_session)
        
        # Create first review
        review1 = service.mark_as_wrong(
            user.id, 
            record.id, 
            wrong_reason="Didn't consider edge case",
            review_plan="Review two pointers technique"
        )
        
        # Mark as wrong again
        review2 = service.mark_as_wrong(
            user.id, 
            record.id, 
            wrong_reason="Updated wrong reason",
            review_plan="Updated review plan"
        )
        
        assert review1.id == review2.id
        assert review2.wrong_reason == "Updated wrong reason"
        assert review2.review_plan == "Updated review plan"
    
    def test_get_reviews(self, db_session):
        """Test getting user reviews."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Create record
        record = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_id="1",
            problem_title="Two Sum",
            status="wrong_answer",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        db_session.add(record)
        db_session.commit()
        
        service = ReviewService(db_session)
        
        # Create reviews
        review1 = service.mark_as_wrong(
            user.id, 
            record.id, 
            wrong_reason="Didn't consider edge case",
            review_plan="Review two pointers technique"
        )
        
        # Create another record and review
        record2 = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_id="2",
            problem_title="Add Two Numbers",
            status="wrong_answer",
            language="python",
            code="def addTwoNumbers(l1, l2): pass"
        )
        db_session.add(record2)
        db_session.commit()
        
        review2 = service.mark_as_wrong(
            user.id, 
            record2.id, 
            wrong_reason="Wrong algorithm",
            review_plan="Study dynamic programming"
        )
        
        reviews = service.get_reviews(user.id)
        
        assert len(reviews) == 2
        assert reviews[0].wrong_reason == "Didn't consider edge case"
        assert reviews[1].wrong_reason == "Wrong algorithm"
    
    def test_get_due_reviews(self, db_session):
        """Test getting due reviews."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Create record
        record = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_id="1",
            problem_title="Two Sum",
            status="wrong_answer",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        db_session.add(record)
        db_session.commit()
        
        service = ReviewService(db_session)
        
        # Create review with past due date
        review = Review(
            user_id=user.id,
            record_id=record.id,
            wrong_reason="Didn't consider edge case",
            review_plan="Review two pointers technique",
            next_review_date=datetime.utcnow() - timedelta(days=1)
        )
        db_session.add(review)
        db_session.commit()
        
        due_reviews = service.get_due_reviews(user.id)
        
        assert len(due_reviews) == 1
        assert due_reviews[0].id == review.id
    
    def test_mark_as_reviewed(self, db_session):
        """Test marking a review as completed."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Create record
        record = Record(
            user_id=user.id,
            oj_type="leetcode",
            problem_id="1",
            problem_title="Two Sum",
            status="wrong_answer",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        db_session.add(record)
        db_session.commit()
        
        service = ReviewService(db_session)
        
        # Create review
        review = service.mark_as_wrong(
            user.id, 
            record.id, 
            wrong_reason="Didn't consider edge case",
            review_plan="Review two pointers technique"
        )
        
        original_review_count = review.review_count
        original_next_review_date = review.next_review_date
        
        # Mark as reviewed
        updated_review = service.mark_as_reviewed(review.id, user.id)
        
        assert updated_review.review_count == original_review_count + 1
        assert updated_review.next_review_date > original_next_review_date
    
    def test_mark_as_reviewed_not_found(self, db_session):
        """Test marking non-existent review as completed."""
        service = ReviewService(db_session)
        result = service.mark_as_reviewed(999, 1)
        assert result is None
    
    def test_calculate_next_review_date(self, db_session):
        """Test next review date calculation."""
        service = ReviewService(db_session)
        
        # Test first review (1 day)
        next_date = service._calculate_next_review_date(0)
        expected_date = datetime.utcnow() + timedelta(days=1)
        assert abs((next_date - expected_date).total_seconds()) < 60  # Within 1 minute
        
        # Test second review (3 days)
        next_date = service._calculate_next_review_date(1)
        expected_date = datetime.utcnow() + timedelta(days=3)
        assert abs((next_date - expected_date).total_seconds()) < 60
        
        # Test beyond intervals (30 days)
        next_date = service._calculate_next_review_date(10)
        expected_date = datetime.utcnow() + timedelta(days=30)
        assert abs((next_date - expected_date).total_seconds()) < 60 