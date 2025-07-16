from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from app.models import OJType, Record, RecordStatus, User
from app.schemas import RecordCreate
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
            "problem_id": 1,
            "problem_title": "Two Sum",
            "execution_result": "Accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "4 ms",
            "memory": "14.2 MB",
            "runtime_percentile": 90.0,
            "memory_percentile": 80.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["Array"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/1/",
            "notion_url": None,
            "git_file_path": None,
        }
        record = service.create_record(user.id, RecordCreate(**record_data))
        assert record.id is not None
        assert record.user_id == user.id
        assert record.oj_type == "leetcode"
        assert record.problem_id == 1
        assert record.execution_result == "Accepted"
        assert record.language == "python"
        assert record.code == "def twoSum(nums, target): pass"
        assert record.runtime == "4 ms"
        assert record.memory == "14.2 MB"
        assert record.runtime_percentile == 90.0
        assert record.memory_percentile == 80.0
        assert record.total_correct == 10
        assert record.total_testcases == 12
        assert record.topic_tags == ["Array"]
        assert record.ai_analysis is None
        assert record.oj_sync_status == "pending"
        assert record.github_sync_status == "pending"
        assert record.ai_sync_status == "pending"
        assert record.submission_url == "https://leetcode.com/submissions/detail/1/"
        assert record.notion_url is None
        assert record.git_file_path is None

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
            "problem_id": 1,
            "problem_title": "Two Sum",
            "execution_result": "Accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "4 ms",
            "memory": "14.2 MB",
            "runtime_percentile": 90.0,
            "memory_percentile": 80.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["Array"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/1/",
            "notion_url": None,
            "git_file_path": None,
        }
        created_record = service.create_record(user.id, RecordCreate(**record_data))

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
            "problem_id": 1,
            "problem_title": "Two Sum",
            "execution_result": "Accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "4 ms",
            "memory": "14.2 MB",
            "runtime_percentile": 90.0,
            "memory_percentile": 80.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["Array"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/1/",
            "notion_url": None,
            "git_file_path": None,
        }
        record_data2 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_id": 2,
            "problem_title": "Add Two Numbers",
            "execution_result": "Accepted",
            "language": "python",
            "code": "def addTwoNumbers(l1, l2): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "8 ms",
            "memory": "15.5 MB",
            "runtime_percentile": 85.0,
            "memory_percentile": 75.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["Linked List"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/2/",
            "notion_url": None,
            "git_file_path": None,
        }
        service.create_record(user.id, RecordCreate(**record_data1))
        service.create_record(user.id, RecordCreate(**record_data2))

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
            "problem_id": 1,
            "problem_title": "Two Sum",
            "execution_result": "Accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "4 ms",
            "memory": "14.2 MB",
            "runtime_percentile": 90.0,
            "memory_percentile": 80.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["Array"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/1/",
            "notion_url": None,
            "git_file_path": None,
        }
        record_data2 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_id": 2,
            "problem_title": "Add Two Numbers",
            "execution_result": "Wrong Answer",
            "language": "python",
            "code": "def addTwoNumbers(l1, l2): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "8 ms",
            "memory": "15.5 MB",
            "runtime_percentile": 85.0,
            "memory_percentile": 75.0,
            "total_correct": 9,
            "total_testcases": 12,
            "topic_tags": ["Linked List"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/2/",
            "notion_url": None,
            "git_file_path": None,
        }
        service.create_record(user.id, RecordCreate(**record_data1))
        service.create_record(user.id, RecordCreate(**record_data2))

        # Get accepted records only
        accepted_records = service.get_user_records(
            user.id, execution_result=RecordStatus.ACCEPTED
        )
        assert len(accepted_records) == 1
        assert accepted_records[0].execution_result == RecordStatus.ACCEPTED

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
            "problem_id": 1,
            "problem_title": "Two Sum",
            "execution_result": "Accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "4 ms",
            "memory": "14.2 MB",
            "runtime_percentile": 90.0,
            "memory_percentile": 80.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["Array"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/1/",
            "notion_url": None,
            "git_file_path": None,
        }
        created_record = service.create_record(user.id, RecordCreate(**record_data))

        # Update record
        update_data = {
            "execution_result": "Wrong Answer",
            "code": "def twoSum(nums, target): return []",
        }
        updated_record = service.update_record(created_record.id, update_data)

        assert updated_record.execution_result == RecordStatus.WRONG_ANSWER
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
            "problem_id": 1,
            "problem_title": "Two Sum",
            "execution_result": "Accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "4 ms",
            "memory": "14.2 MB",
            "runtime_percentile": 90.0,
            "memory_percentile": 80.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["Array"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/1/",
            "notion_url": None,
            "git_file_path": None,
        }
        created_record = service.create_record(user.id, RecordCreate(**record_data))

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
            "problem_id": 1,
            "problem_title": "Two Sum",
            "execution_result": "Accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "4 ms",
            "memory": "14.2 MB",
            "runtime_percentile": 90.0,
            "memory_percentile": 80.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["Array"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/1/",
            "notion_url": None,
            "git_file_path": None,
        }
        record_data2 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_id": 2,
            "problem_title": "Add Two Numbers",
            "execution_result": "Wrong Answer",
            "language": "python",
            "code": "def addTwoNumbers(l1, l2): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "8 ms",
            "memory": "15.5 MB",
            "runtime_percentile": 85.0,
            "memory_percentile": 75.0,
            "total_correct": 9,
            "total_testcases": 12,
            "topic_tags": ["Linked List"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/2/",
            "notion_url": None,
            "git_file_path": None,
        }
        record_data3 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_id": 3,
            "problem_title": "Longest Substring",
            "execution_result": "Accepted",
            "language": "java",
            "code": "public int lengthOfLongestSubstring(String s) { return 0; }",
            "submit_time": datetime.utcnow(),
            "runtime": "10 ms",
            "memory": "16.5 MB",
            "runtime_percentile": 95.0,
            "memory_percentile": 90.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["String"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/3/",
            "notion_url": None,
            "git_file_path": None,
        }
        service.create_record(user.id, RecordCreate(**record_data1))
        service.create_record(user.id, RecordCreate(**record_data2))
        service.create_record(user.id, RecordCreate(**record_data3))

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
            "problem_id": 1,
            "problem_title": "Two Sum",
            "execution_result": "Accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "4 ms",
            "memory": "14.2 MB",
            "runtime_percentile": 90.0,
            "memory_percentile": 80.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["Array"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/1/",
            "notion_url": None,
            "git_file_path": None,
        }
        record_data2 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_id": 2,
            "problem_title": "Add Two Numbers",
            "execution_result": "Accepted",
            "language": "python",
            "code": "def addTwoNumbers(l1, l2): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "8 ms",
            "memory": "15.5 MB",
            "runtime_percentile": 85.0,
            "memory_percentile": 75.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["Linked List"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/2/",
            "notion_url": None,
            "git_file_path": None,
        }
        record_data3 = {
            "user_id": user.id,
            "oj_type": "leetcode",
            "problem_id": 3,
            "problem_title": "Longest Substring Without Repeating Characters",
            "execution_result": "Accepted",
            "language": "java",
            "code": "public int lengthOfLongestSubstring(String s) { return 0; }",
            "submit_time": datetime.utcnow(),
            "runtime": "10 ms",
            "memory": "16.5 MB",
            "runtime_percentile": 95.0,
            "memory_percentile": 90.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["String"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/3/",
            "notion_url": None,
            "git_file_path": None,
        }
        service.create_record(user.id, RecordCreate(**record_data1))
        service.create_record(user.id, RecordCreate(**record_data2))
        service.create_record(user.id, RecordCreate(**record_data3))

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
            "problem_id": 1,
            "problem_title": "Two Sum",
            "execution_result": "Accepted",
            "language": "python",
            "code": "def twoSum(nums, target): pass",
            "submit_time": datetime.utcnow(),
            "runtime": "4 ms",
            "memory": "14.2 MB",
            "runtime_percentile": 90.0,
            "memory_percentile": 80.0,
            "total_correct": 10,
            "total_testcases": 12,
            "topic_tags": ["Array"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://leetcode.com/submissions/detail/1/",
            "notion_url": None,
            "git_file_path": None,
        }
        record_data2 = {
            "user_id": user.id,
            "oj_type": "codeforces",
            "problem_id": 1,
            "problem_title": "Watermelon",
            "execution_result": "Accepted",
            "language": "cpp",
            "code": "#include <iostream>",
            "submit_time": datetime.utcnow(),
            "runtime": "0 ms",
            "memory": "0 KB",
            "runtime_percentile": 100.0,
            "memory_percentile": 100.0,
            "total_correct": 1,
            "total_testcases": 1,
            "topic_tags": ["Math"],
            "ai_analysis": None,
            "oj_sync_status": "pending",
            "github_sync_status": "pending",
            "ai_sync_status": "pending",
            "submission_url": "https://codeforces.com/submissions/1",
            "notion_url": None,
            "git_file_path": None,
        }
        service.create_record(user.id, RecordCreate(**record_data1))
        service.create_record(user.id, RecordCreate(**record_data2))

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
                "problem_id": i + 1,
                "problem_title": f"Problem {i + 1}",
                "execution_result": "Accepted",
                "language": "python",
                "code": f"def problem{i + 1}(): pass",
                "submit_time": datetime.utcnow(),
                "runtime": "4 ms",
                "memory": "14.2 MB",
                "runtime_percentile": 90.0,
                "memory_percentile": 80.0,
                "total_correct": 10,
                "total_testcases": 12,
                "topic_tags": ["Array"],
                "ai_analysis": None,
                "oj_sync_status": "pending",
                "github_sync_status": "pending",
                "ai_sync_status": "pending",
                "submission_url": f"https://leetcode.com/submissions/detail/{i + 1}",
                "notion_url": None,
                "git_file_path": None,
            }
            service.create_record(user.id, RecordCreate(**record_data))

        # Get records with pagination
        records = service.get_user_records(user.id, skip=0, limit=3)
        assert len(records) == 3

        records = service.get_user_records(user.id, skip=3, limit=3)
        assert len(records) == 2  # Only 2 records remaining
