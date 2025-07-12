import pytest
from unittest.mock import patch, MagicMock
from app.services.record_service import RecordService
from app.schemas import RecordCreate
from app.models import User, Record, Tag

class TestRecordService:
    """Test RecordService functionality."""
    
    def test_create_record(self, db_session):
        """Test record creation."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        service = RecordService(db_session)
        record_data = RecordCreate(
            oj_type="leetcode",
            submission_id=123456789,
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        
        record = service.create_record(user.id, record_data)
        
        assert record.submission_id == 123456789
        assert record.user_id == user.id
        assert record.problem_title == "Two Sum"
        assert record.oj_type == "leetcode"
    
    def test_get_records(self, db_session):
        """Test getting user records."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
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
            problem_title="Add Two Numbers",
            status="accepted",
            language="python",
            code="def addTwoNumbers(l1, l2): pass"
        )
        db_session.add_all([record1, record2])
        db_session.commit()
        
        service = RecordService(db_session)
        records = service.get_records(user.id)
        
        assert len(records) == 2
        assert records[0].problem_title == "Two Sum"
        assert records[1].problem_title == "Add Two Numbers"
    
    def test_get_record(self, db_session):
        """Test getting record by submission_id."""
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
            submission_id=123456789,
            oj_type="leetcode",
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        db_session.add(record)
        db_session.commit()
        
        service = RecordService(db_session)
        found_record = service.get_record(user.id, 123456789)
        
        assert found_record is not None
        assert found_record.submission_id == 123456789
        assert found_record.problem_title == "Two Sum"
    
    def test_get_record_not_found(self, db_session):
        """Test getting non-existent record by submission_id."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        service = RecordService(db_session)
        record = service.get_record(user.id, 999999999)
        assert record is None
    
    def test_analyze_record_with_ai(self, db_session):
        """Test record analysis with AI."""
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
            submission_id=123456789,
            oj_type="leetcode",
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        db_session.add(record)
        db_session.commit()
        
        service = RecordService(db_session)
        
        mock_ai_service = MagicMock()
        mock_ai_service.analyze_code.return_value = {
            "complexity": "O(n)",
            "tags": ["Two Pointers", "HashMap"],
            "analysis": "Good solution using hash map"
        }
        
        result = service.analyze_record_with_ai(record, mock_ai_service)
        
        assert result is not None
        assert result["complexity"] == "O(n)"
        assert "Two Pointers" in result["tags"]
        assert record.ai_analysis is not None
    
    def test_add_tag(self, db_session):
        """Test adding a new tag."""
        service = RecordService(db_session)
        
        tag = service.add_tag("Two Pointers", "Two pointers technique")
        
        assert tag.id is not None
        assert tag.name == "Two Pointers"
        assert tag.wiki == "Two pointers technique"
    
    def test_add_existing_tag(self, db_session):
        """Test adding an existing tag."""
        service = RecordService(db_session)
        
        # Add tag first time
        tag1 = service.add_tag("Two Pointers", "Two pointers technique")
        
        # Add same tag again
        tag2 = service.add_tag("Two Pointers", "Different description")
        
        assert tag1.id == tag2.id
        assert tag1.name == tag2.name
    
    def test_get_tags(self, db_session):
        """Test getting all tags."""
        service = RecordService(db_session)
        
        # Add some tags
        service.add_tag("Two Pointers", "Two pointers technique")
        service.add_tag("HashMap", "Hash map technique")
        
        tags = service.get_tags()
        
        assert len(tags) == 2
        tag_names = [tag.name for tag in tags]
        assert "Two Pointers" in tag_names
        assert "HashMap" in tag_names
    
    def test_assign_tags_to_record(self, db_session):
        """Test assigning tags to a record."""
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
            submission_id=123456789,
            oj_type="leetcode",
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass"
        )
        db_session.add(record)
        db_session.commit()
        
        service = RecordService(db_session)
        
        # Assign tags
        updated_record = service.assign_tags_to_record(record, ["Two Pointers", "HashMap"])
        
        assert len(updated_record.tags) == 2
        tag_names = [tag.name for tag in updated_record.tags]
        assert "Two Pointers" in tag_names
        assert "HashMap" in tag_names
    
    def test_to_record_out(self, db_session):
        """Test converting record to RecordOut schema."""
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
            submission_id=123456789,
            oj_type="leetcode",
            problem_title="Two Sum",
            status="accepted",
            language="python",
            code="def twoSum(nums, target): pass",
            ai_analysis={"complexity": "O(n)"}
        )
        db_session.add(record)
        db_session.commit()
        
        service = RecordService(db_session)
        record_out = service.to_record_out(record)
        
        assert record_out.submission_id == 123456789
        assert record_out.problem_title == "Two Sum"
        assert record_out.analyzed is True
        assert record_out.ai_analysis == {"complexity": "O(n)"} 