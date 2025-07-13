import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app import models, schemas

logger = logging.getLogger(__name__)


class RecordService:
    """Service for problem record business logic."""

    def __init__(self, db: Session):
        self.db = db

    def create_record(
        self, user_id: int, record_data: schemas.RecordCreate
    ) -> models.Record:
        """Create a new problem record."""
        db_record = models.Record(
            id=record_data.id,
            user_id=user_id,
            oj_type=record_data.oj_type,
            problem_id=record_data.problem_id,
            language=record_data.language,
            code=record_data.code,
            submit_time=record_data.submit_time or None,
            submission_url=record_data.submission_url,
            execution_result=record_data.execution_result,
            oj_status=record_data.oj_status,
            runtime=record_data.runtime,
            memory=record_data.memory,
            runtime_percentile=record_data.runtime_percentile,
            memory_percentile=record_data.memory_percentile,
            total_correct=record_data.total_correct,
            total_testcases=record_data.total_testcases,
            topic_tags=record_data.topic_tags,
        )
        self.db.add(db_record)
        self.db.commit()
        self.db.refresh(db_record)
        return db_record

    def get_record(self, id: int) -> Optional[models.Record]:
        """Get a single problem record by id for a user."""
        return (
            self.db.query(models.Record)
            .filter(
                models.Record.id == id,
            )
            .first()
        )

    def get_records(self, user_id: int) -> List[models.Record]:
        """Get all problem records for a user."""
        return (
            self.db.query(models.Record)
            .filter(models.Record.user_id == user_id)
            .order_by(
                models.Record.submit_time.desc().nullslast(),
                models.Record.created_at.desc(),
            )
            .all()
        )

    def to_record_out(self, record: models.Record) -> schemas.RecordOut:
        """Convert a Record model to RecordOut schema, with analyzed flag."""
        return schemas.RecordOut(
            user_id=record.user_id,
            oj_type=record.oj_type,
            id=record.id,
            execution_result=record.execution_result,
            oj_sync_status=record.oj_sync_status,
            github_sync_status=record.github_sync_status,
            ai_analysis_status=record.ai_analysis_status,
            language=record.language,
            code=record.code,
            submit_time=record.submit_time,
            runtime=record.runtime,
            memory=record.memory,
            submission_url=record.submission_url,
            topic_tags=record.topic_tags,
            ai_analysis=record.ai_analysis,
            runtime_percentile=record.runtime_percentile,
            memory_percentile=record.memory_percentile,
            total_correct=record.total_correct,
            total_testcases=record.total_testcases,
            notion_url=record.notion_url,
            git_file_path=getattr(record, "git_file_path", None),
            created_at=record.created_at,
            updated_at=record.updated_at,
        )

    def create_leetcode_problem(
        self, problem_data: schemas.LeetCodeProblemCreate
    ) -> models.LeetCodeProblem:
        """Create a new LeetCode problem entry."""
        db_problem = models.LeetCodeProblem(
            title=problem_data.title,
            question_id=problem_data.question_id,
            difficulty=problem_data.difficulty,
            tags=problem_data.tags,
            content=problem_data.content,
            url=problem_data.url,
        )
        self.db.add(db_problem)
        self.db.commit()
        self.db.refresh(db_problem)
        return db_problem

    def get_leetcode_problem(self, title_slug: str) -> Optional[models.LeetCodeProblem]:
        """Get a single LeetCodeProblem by title_slug."""
        return (
            self.db.query(models.LeetCodeProblem)
            .filter(models.LeetCodeProblem.title_slug == title_slug)
            .first()
        )

    def add_tag(
        self, name: str, wiki: Optional[str] = None, notion_url: Optional[str] = None
    ) -> models.Tag:
        """Add a new tag or return existing one by name."""
        tag = self.db.query(models.Tag).filter(models.Tag.name == name).first()
        if tag:
            return tag
        tag = models.Tag(name=name, wiki=wiki, notion_url=notion_url)
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def get_tags(self) -> List[models.Tag]:
        """Get all tags."""
        return self.db.query(models.Tag).all()

    def assign_tags_to_record(self, record: models.Record, tag_names: List[str]):
        """Assign tags to a record by tag names."""
        tags = [self.add_tag(name) for name in tag_names]
        record.tags = tags
        self.db.commit()
        self.db.refresh(record)
        return record
