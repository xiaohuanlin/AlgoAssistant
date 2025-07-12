import pytest
from datetime import datetime
from app.models import User, UserConfig, Record, Tag, Review, SyncLog
from app.schemas import UserCreate, RecordCreate, TagCreate

class TestUserModel:
    """Test User model."""
    
    def test_create_user(self, db_session):
        """Test user creation."""
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
            nickname="Test User"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.nickname == "Test User"
        assert user.created_at is not None
        assert user.updated_at is not None
    
    def test_user_config_relationship(self, db_session):
        """Test user-config relationship."""
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        config = UserConfig(
            user_id=user.id,
            leetcode_name="leetcode_user",
            github_repo="user/repo"
        )
        db_session.add(config)
        db_session.commit()
        
        # Test relationship
        assert user.configs.leetcode_name == "leetcode_user"
        assert user.configs.github_repo == "user/repo"

class TestRecordModel:
    """Test Record model."""
    
    def test_create_record(self, db_session):
        """Test record creation."""
        record = Record(
            user_id=1,
            submission_id=123456789,
            oj_type="leetcode",
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        db_session.add(record)
        db_session.commit()
        db_session.refresh(record)
        
        assert record.submission_id == 123456789
        assert record.oj_type == "leetcode"
        assert record.status == "accepted"
        assert record.created_at is not None
    
    def test_record_tags_relationship(self, db_session):
        """Test record-tags relationship."""
        # Create user
        user = User(username="testuser", email="test@example.com", password_hash="hash")
        db_session.add(user)
        db_session.commit()
        
        # Create record
        record = Record(
            user_id=user.id,
            submission_id=123456789,
            oj_type="leetcode",
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        db_session.add(record)
        db_session.commit()
        
        # Create tags
        tag1 = Tag(name="Two Pointers", wiki="Two pointers technique")
        tag2 = Tag(name="HashMap", wiki="Hash map technique")
        db_session.add_all([tag1, tag2])
        db_session.commit()
        
        # Add tags to record
        record.tags.append(tag1)
        record.tags.append(tag2)
        db_session.commit()
        
        # Test relationship
        assert len(record.tags) == 2
        assert record.tags[0].name == "Two Pointers"
        assert record.tags[1].name == "HashMap"

class TestTagModel:
    """Test Tag model."""
    
    def test_create_tag(self, db_session):
        """Test tag creation."""
        tag = Tag(
            name="Two Pointers",
            wiki="A technique using two pointers to solve array problems"
        )
        db_session.add(tag)
        db_session.commit()
        db_session.refresh(tag)
        
        assert tag.id is not None
        assert tag.name == "Two Pointers"
        assert tag.wiki == "A technique using two pointers to solve array problems"
        assert tag.created_at is not None
    
    def test_tag_records_relationship(self, db_session):
        """Test tag-records relationship."""
        # Create user
        user = User(username="testuser", email="test@example.com", password_hash="hash")
        db_session.add(user)
        db_session.commit()
        
        # Create tag
        tag = Tag(name="Two Pointers")
        db_session.add(tag)
        db_session.commit()
        
        # Create records
        record1 = Record(
            user_id=user.id,
            submission_id=123456789,
            oj_type="leetcode",
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        record2 = Record(
            user_id=user.id,
            submission_id=123456790,
            oj_type="leetcode",
            problem_title="3Sum",
            status="accepted",
            language="python",
            code="def threeSum(nums): pass"
        )
        db_session.add_all([record1, record2])
        db_session.commit()
        
        # Add records to tag
        tag.records.append(record1)
        tag.records.append(record2)
        db_session.commit()
        
        # Test relationship
        assert len(tag.records) == 2
        record_titles = [record.problem_title for record in tag.records]
        assert "Two Sum" in record_titles
        assert "3Sum" in record_titles

class TestReviewModel:
    """Test Review model."""
    
    def test_create_review(self, db_session):
        """Test review creation."""
        review = Review(
            user_id=1,
            record_id=123456789,
            wrong_reason="Didn't consider edge case",
            review_plan="Review two pointers technique"
        )
        db_session.add(review)
        db_session.commit()
        db_session.refresh(review)
        
        assert review.id is not None
        assert review.wrong_reason == "Didn't consider edge case"
        assert review.review_plan == "Review two pointers technique"
        assert review.created_at is not None
        assert review.next_review_date is not None

class TestSyncLogModel:
    """Test SyncLog model."""
    
    def test_create_sync_log(self, db_session):
        """Test sync log creation."""
        sync_log = SyncLog(
            user_id=1,
            oj_type="leetcode",
            record_count=10,
            summary="Synced 10 records"
        )
        db_session.add(sync_log)
        db_session.commit()
        db_session.refresh(sync_log)
        
        assert sync_log.id is not None
        assert sync_log.oj_type == "leetcode"
        assert sync_log.record_count == 10
        assert sync_log.summary == "Synced 10 records"
        assert sync_log.created_at is not None 