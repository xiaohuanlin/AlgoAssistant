"""
Tests for RecordQueryBuilder used in records API.
"""

from datetime import datetime

import pytest
from sqlalchemy.orm import Session

from app import models
from app.api.records import RecordQueryBuilder
from app.schemas.record import LanguageType, OJType, SyncStatus


class TestRecordQueryBuilder:
    """Test cases for RecordQueryBuilder."""

    @pytest.fixture
    def sample_user(self, db_session: Session):
        """Create a sample user for testing."""
        user = models.User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
            nickname="Test User",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def sample_problems(self, db_session: Session):
        """Create sample problems for testing."""
        problems = []
        for i in range(3):
            problem = models.Problem(
                title=f"Problem {i}",
                source="leetcode",
                source_id=str(i + 1),
                difficulty="Easy",
                tags=["Array"],
                description=f"Problem {i} description",
            )
            db_session.add(problem)
            problems.append(problem)

        db_session.commit()
        for problem in problems:
            db_session.refresh(problem)
        return problems

    @pytest.fixture
    def sample_records(self, db_session: Session, sample_user, sample_problems):
        """Create sample records for testing."""
        records = []

        for i, problem in enumerate(sample_problems):
            record = models.Record(
                user_id=sample_user.id,
                problem_id=problem.id,
                oj_type=OJType.leetcode.value,
                execution_result="Accepted" if i % 2 == 0 else "Wrong Answer",
                language=(
                    LanguageType.python.value if i % 2 == 0 else LanguageType.java.value
                ),
                code=f"def solution(): pass # {i}",
                submission_id=1000 + i,
                submit_time=datetime(2024, 1, i + 1, 12, 0, 0),
                github_sync_status=(
                    SyncStatus.COMPLETED.value if i == 0 else SyncStatus.PENDING.value
                ),
                oj_sync_status=SyncStatus.COMPLETED.value,
                ai_sync_status=SyncStatus.PENDING.value,
                notion_sync_status=SyncStatus.PENDING.value,
            )
            db_session.add(record)
            records.append(record)

        db_session.commit()
        for record in records:
            db_session.refresh(record)
        return records

    @pytest.fixture
    def sample_tags(self, db_session: Session, sample_records):
        """Create sample tags and associate with records."""
        tags = []
        for i in range(2):
            tag = models.Tag(name=f"tag{i}")
            db_session.add(tag)
            tags.append(tag)

        db_session.commit()
        for tag in tags:
            db_session.refresh(tag)

        # Associate tags with records
        sample_records[0].tags.append(tags[0])  # First record gets tag0
        sample_records[1].tags.append(tags[1])  # Second record gets tag1
        sample_records[2].tags.extend(tags)  # Third record gets both tags

        db_session.commit()
        return tags

    def test_basic_query_builder(self, db_session: Session, sample_user):
        """Test basic query builder initialization."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        query = builder.get_query()

        # Should filter by user_id
        assert query.filter_by(user_id=sample_user.id).count() == 0

    def test_single_tag_filter(
        self, db_session: Session, sample_user, sample_records, sample_tags
    ):
        """Test filtering by a single tag."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(tag="tag0")

        results = builder.get_query().all()

        # Should return records that have tag0
        assert len(results) == 2  # First and third records have tag0

    def test_multiple_tags_filter(
        self, db_session: Session, sample_user, sample_records, sample_tags
    ):
        """Test filtering by multiple tags."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(tags="tag0,tag1")

        results = builder.get_query().all()

        # Should return records that have either tag0 or tag1
        assert len(results) == 3  # All records have at least one of these tags

    def test_status_filter(self, db_session: Session, sample_user, sample_records):
        """Test filtering by execution status."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(status=["Accepted"])

        results = builder.get_query().all()

        # Should return only accepted records
        assert len(results) == 2  # Records 0 and 2 are accepted

    def test_sync_status_filters(
        self, db_session: Session, sample_user, sample_records
    ):
        """Test filtering by sync status."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(github_sync_status=[SyncStatus.COMPLETED.value])

        results = builder.get_query().all()

        # Should return only records with completed github sync
        assert len(results) == 1  # Only first record has completed github sync

    def test_language_filter(self, db_session: Session, sample_user, sample_records):
        """Test filtering by programming language."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(language=LanguageType.python.value)

        results = builder.get_query().all()

        # Should return only python records
        assert len(results) == 2  # Records 0 and 2 are python

    def test_oj_type_filter(self, db_session: Session, sample_user, sample_records):
        """Test filtering by OJ type."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(oj_type=OJType.leetcode.value)

        results = builder.get_query().all()

        # Should return all records (all are leetcode)
        assert len(results) == 3

    def test_problem_title_filter(
        self, db_session: Session, sample_user, sample_records
    ):
        """Test filtering by problem title."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(problem_title="Problem 0")

        results = builder.get_query().all()

        # Should return records with matching problem title
        assert len(results) == 1
        assert results[0].problem.title == "Problem 0"

    def test_problem_id_filter(
        self, db_session: Session, sample_user, sample_records, sample_problems
    ):
        """Test filtering by problem ID."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(problem_id=sample_problems[0].id)

        results = builder.get_query().all()

        # Should return records with matching problem ID
        assert len(results) == 1
        assert results[0].problem_id == sample_problems[0].id

    def test_time_filter_start_time(
        self, db_session: Session, sample_user, sample_records
    ):
        """Test filtering by start time."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(start_time="2024-01-02T00:00:00Z")

        results = builder.get_query().all()

        # Should return records submitted after start time
        assert len(results) == 2  # Records 1 and 2

    def test_time_filter_end_time(
        self, db_session: Session, sample_user, sample_records
    ):
        """Test filtering by end time."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(end_time="2024-01-02T23:59:59Z")

        results = builder.get_query().all()

        # Should return records submitted before end time
        assert len(results) == 2  # Records 0 and 1

    def test_time_filter_invalid_format(
        self, db_session: Session, sample_user, sample_records
    ):
        """Test time filter with invalid format."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(start_time="invalid-date")

        results = builder.get_query().all()

        # Should return all records (invalid date ignored)
        assert len(results) == 3

    def test_multiple_filters_combined(
        self, db_session: Session, sample_user, sample_records
    ):
        """Test applying multiple filters together."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(
            status=["Accepted"],
            language=LanguageType.python.value,
            github_sync_status=[SyncStatus.COMPLETED.value],
        )

        results = builder.get_query().all()

        # Should return records matching all criteria
        assert len(results) == 1  # Only first record matches all criteria

    def test_empty_filters(self, db_session: Session, sample_user, sample_records):
        """Test applying empty filters."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters()

        results = builder.get_query().all()

        # Should return all records
        assert len(results) == 3

    def test_none_filters(self, db_session: Session, sample_user, sample_records):
        """Test applying None filters."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        builder.apply_filters(tag=None, status=None, language=None)

        results = builder.get_query().all()

        # Should return all records (None filters ignored)
        assert len(results) == 3

    def test_query_builder_chaining(
        self, db_session: Session, sample_user, sample_records
    ):
        """Test that query builder methods can be chained."""
        builder = RecordQueryBuilder(db_session, sample_user.id)
        chained_builder = builder.apply_filters(status=["Accepted"])

        # Should return the same instance for chaining
        assert chained_builder is builder

        results = chained_builder.get_query().all()
        assert len(results) == 2
