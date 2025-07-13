from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from app.models import OJType, Record, RecordStatus, User
from app.services.record_service import RecordService


class TestRecordService:
    """Test cases for RecordService."""

    def test_create_record_success(self, client):
        """Test creating a new record successfully."""
        from app.deps import get_db

        db = next(get_db())

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db.add(user)
        db.commit()

        service = RecordService(db)

        record_data = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "1",
            "problem_title": "Two Sum",
            "status": "accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
            "submitted_at": datetime.utcnow(),
        }

        record = service.create_record(**record_data)

        assert record.id is not None
        assert record.user_id == user.id
        assert record.oj_type == OJType.LEETCODE
        assert record.problem_number == "1"
        assert record.problem_title == "Two Sum"
        assert record.status == RecordStatus.ACCEPTED
        assert record.language == "python"
        assert record.code == "def twoSum(nums, target): pass"

    def test_get_record_by_id(self, client):
        """Test getting a record by ID."""
        from app.deps import get_db

        db = next(get_db())

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db.add(user)
        db.commit()

        service = RecordService(db)

        # Create a record
        record_data = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "1",
            "problem_title": "Two Sum",
            "status": "accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
        }
        created_record = service.create_record(**record_data)

        # Get record by ID
        retrieved_record = service.get_record_by_id(created_record.id)

        assert retrieved_record is not None
        assert retrieved_record.id == created_record.id
        assert retrieved_record.problem_title == "Two Sum"

    def test_get_record_by_id_nonexistent(self, client):
        """Test getting a non-existent record by ID."""
        from app.deps import get_db

        db = next(get_db())

        service = RecordService(db)

        record = service.get_record_by_id(999)

        assert record is None

    def test_get_user_records(self, client):
        """Test getting all records for a user."""
        from app.deps import get_db

        db = next(get_db())

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db.add(user)
        db.commit()

        service = RecordService(db)

        # Create multiple records
        record_data1 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "1",
            "problem_title": "Two Sum",
            "status": "accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
        }
        record_data2 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "2",
            "problem_title": "Add Two Numbers",
            "status": "accepted",
            "language": "python",
            "code": "def addTwoNumbers(l1, l2): pass",
        }
        service.create_record(**record_data1)
        service.create_record(**record_data2)

        # Get user records
        records = service.get_user_records(user.id)

        assert len(records) == 2
        assert all(record.user_id == user.id for record in records)

    def test_get_user_records_with_filters(self, client):
        """Test getting user records with filters."""
        from app.deps import get_db

        db = next(get_db())

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db.add(user)
        db.commit()

        service = RecordService(db)

        # Create records with different statuses
        record_data1 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "1",
            "problem_title": "Two Sum",
            "status": "accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
        }
        record_data2 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "2",
            "problem_title": "Add Two Numbers",
            "status": "wrong_answer",
            "language": "python",
            "code": "def addTwoNumbers(l1, l2): pass",
        }
        service.create_record(**record_data1)
        service.create_record(**record_data2)

        # Get accepted records only
        accepted_records = service.get_user_records(
            user.id, status=RecordStatus.ACCEPTED
        )
        assert len(accepted_records) == 1
        assert accepted_records[0].status == RecordStatus.ACCEPTED

        # Get records by language
        python_records = service.get_user_records(user.id, language="python")
        assert len(python_records) == 2
        assert all(record.language == "python" for record in python_records)

    def test_update_record(self, client):
        """Test updating a record."""
        from app.deps import get_db

        db = next(get_db())

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db.add(user)
        db.commit()

        service = RecordService(db)

        # Create a record
        record_data = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "1",
            "problem_title": "Two Sum",
            "status": "accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
        }
        created_record = service.create_record(**record_data)

        # Update record
        update_data = {
            "status": "wrong_answer",
            "code": "def twoSum(nums, target): return []",
        }
        updated_record = service.update_record(created_record.id, update_data)

        assert updated_record.status == RecordStatus.WRONG_ANSWER
        assert updated_record.code == "def twoSum(nums, target): return []"
        assert updated_record.problem_title == "Two Sum"  # Should remain unchanged

    def test_delete_record(self, client):
        """Test deleting a record."""
        from app.deps import get_db

        db = next(get_db())

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db.add(user)
        db.commit()

        service = RecordService(db)

        # Create a record
        record_data = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "1",
            "problem_title": "Two Sum",
            "status": "accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
        }
        created_record = service.create_record(**record_data)

        # Delete record
        service.delete_record(created_record.id)

        # Verify record is deleted
        retrieved_record = service.get_record_by_id(created_record.id)
        assert retrieved_record is None

    def test_get_user_statistics(self, client):
        """Test getting user statistics."""
        from app.deps import get_db

        db = next(get_db())

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db.add(user)
        db.commit()

        service = RecordService(db)

        # Create records with different statuses
        record_data1 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "1",
            "problem_title": "Two Sum",
            "status": "accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
        }
        record_data2 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "2",
            "problem_title": "Add Two Numbers",
            "status": "wrong_answer",
            "language": "python",
            "code": "def addTwoNumbers(l1, l2): pass",
        }
        record_data3 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "3",
            "problem_title": "Longest Substring",
            "status": "accepted",
            "language": "java",
            "code": "public int lengthOfLongestSubstring(String s) { return 0; }",
        }
        service.create_record(**record_data1)
        service.create_record(**record_data2)
        service.create_record(**record_data3)

        # Get statistics
        stats = service.get_user_statistics(user.id)

        assert stats["total_records"] == 3
        assert stats["accepted_records"] == 2
        assert stats["wrong_answer_records"] == 1
        assert stats["languages"] == ["python", "java"]
        assert stats["oj_types"] == ["leetcode"]

    def test_search_records(self, client):
        """Test searching records."""
        from app.deps import get_db

        db = next(get_db())

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db.add(user)
        db.commit()

        service = RecordService(db)

        # Create records with different titles
        record_data1 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "1",
            "problem_title": "Two Sum",
            "status": "accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
        }
        record_data2 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "2",
            "problem_title": "Add Two Numbers",
            "status": "accepted",
            "language": "python",
            "code": "def addTwoNumbers(l1, l2): pass",
        }
        record_data3 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "3",
            "problem_title": "Longest Substring Without Repeating Characters",
            "status": "accepted",
            "language": "java",
            "code": "public int lengthOfLongestSubstring(String s) { return 0; }",
        }
        service.create_record(**record_data1)
        service.create_record(**record_data2)
        service.create_record(**record_data3)

        # Search for "Two"
        results = service.search_records(user.id, "Two")
        assert len(results) == 2
        assert all("Two" in record.problem_title for record in results)

        # Search for "Longest"
        results = service.search_records(user.id, "Longest")
        assert len(results) == 1
        assert "Longest" in results[0].problem_title

    def test_get_records_by_oj_type(self, client):
        """Test getting records by OJ type."""
        from app.deps import get_db

        db = next(get_db())

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db.add(user)
        db.commit()

        service = RecordService(db)

        # Create records for different OJ types
        record_data1 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_number": "1",
            "problem_title": "Two Sum",
            "status": "accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
        }
        record_data2 = {
            "user_id": user.id,
            "oj_type": "codeforces",
            "problem_number": "A",
            "problem_title": "Watermelon",
            "status": "accepted",
            "language": "cpp",
            "code": "#include <iostream>",
        }
        service.create_record(**record_data1)
        service.create_record(**record_data2)

        # Get LeetCode records
        leetcode_records = service.get_user_records(user.id, oj_type=OJType.LEETCODE)
        assert len(leetcode_records) == 1
        assert leetcode_records[0].oj_type == OJType.LEETCODE

        # Get Codeforces records
        codeforces_records = service.get_user_records(
            user.id, oj_type=OJType.CODEFORCES
        )
        assert len(codeforces_records) == 1
        assert codeforces_records[0].oj_type == OJType.CODEFORCES

    def test_get_records_pagination(self, client):
        """Test getting records with pagination."""
        from app.deps import get_db

        db = next(get_db())

        # Create a user first
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
        )
        db.add(user)
        db.commit()

        service = RecordService(db)

        # Create multiple records
        for i in range(5):
            record_data = {
                "user_id": user.id,
                "oj_type": "leetcode",
                "problem_number": str(i + 1),
                "problem_title": f"Problem {i + 1}",
                "status": "accepted",
                "language": "python",
                "code": f"def problem{i + 1}(): pass",
            }
            service.create_record(**record_data)

        # Get records with pagination
        records = service.get_user_records(user.id, skip=0, limit=3)
        assert len(records) == 3

        records = service.get_user_records(user.id, skip=3, limit=3)
        assert len(records) == 2  # Only 2 records remaining
