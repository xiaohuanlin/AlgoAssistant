import logging
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas

logger = logging.getLogger(__name__)


class RecordService:
    """Service for problem record business logic."""

    def __init__(self, db: Session):
        self.db = db

    def get_analysis_stats(self, user_id: int) -> schemas.AIAnalysisStatsResponse:
        """Get AI analysis statistics for a user.

        Args:
            user_id: User ID

        Returns:
            AIAnalysisStatsResponse containing:
            - total_records: Total number of records
            - analyzed_records: Number of analyzed records
            - pending_records: Number of pending records
            - failed_records: Number of failed records
            - analysis_coverage: Analysis coverage percentage
        """
        try:
            # Get total records count
            total_records = (
                self.db.query(func.count(models.Record.id))
                .filter(models.Record.user_id == user_id)
                .scalar()
            )

            # Get analyzed records count
            analyzed_records = (
                self.db.query(func.count(models.Record.id))
                .filter(
                    models.Record.user_id == user_id,
                    models.Record.ai_analysis.isnot(None),
                )
                .scalar()
            )

            # Get failed records count
            failed_records = (
                self.db.query(func.count(models.Record.id))
                .filter(
                    models.Record.user_id == user_id,
                    models.Record.ai_sync_status == schemas.AIAnalysisStatus.FAILED,
                )
                .scalar()
            )

            # Calculate pending records count
            pending_records = total_records - analyzed_records

            # Calculate analysis coverage
            analysis_coverage = (
                (analyzed_records / total_records * 100) if total_records > 0 else 0.0
            )

            return schemas.AIAnalysisStatsResponse(
                total_records=total_records,
                analyzed_records=analyzed_records,
                pending_records=pending_records,
                failed_records=failed_records,
                analysis_coverage=analysis_coverage,
            )

        except Exception as e:
            logger.error(f"Failed to get analysis stats: {e}")
            raise

    def create_record(
        self, user_id: int, record_data: schemas.RecordCreate
    ) -> models.Record:
        """Create a new problem record."""
        db_record = models.Record(
            user_id=user_id,
            problem_id=record_data.problem_id,
            oj_type=record_data.oj_type,
            execution_result=record_data.execution_result,
            language=record_data.language,
            code=record_data.code,
            submit_time=record_data.submit_time,
            runtime=record_data.runtime,
            memory=record_data.memory,
            runtime_percentile=record_data.runtime_percentile,
            memory_percentile=record_data.memory_percentile,
            total_correct=record_data.total_correct,
            total_testcases=record_data.total_testcases,
            topic_tags=record_data.topic_tags,
            ai_analysis=record_data.ai_analysis,
            oj_sync_status=record_data.oj_sync_status,
            github_sync_status=record_data.github_sync_status,
            ai_sync_status=record_data.ai_sync_status,
            submission_id=record_data.submission_id,
            submission_url=record_data.submission_url,
            notion_url=record_data.notion_url,
            git_file_path=record_data.git_file_path,
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

    def to_record_list_out(self, record: models.Record) -> schemas.RecordListOut:
        problem_title = (
            record.problem.title if getattr(record, "problem", None) else None
        )
        problem_number = record.problem.id if getattr(record, "problem", None) else None
        return schemas.RecordListOut(
            id=record.id,
            problem_title=problem_title,
            problem_number=problem_number,
            execution_result=record.execution_result,
            oj_type=record.oj_type,
            language=record.language,
            oj_sync_status=record.oj_sync_status,
            github_sync_status=record.github_sync_status,
            ai_sync_status=record.ai_sync_status,
            submit_time=record.submit_time,
            topic_tags=record.topic_tags,
            git_file_path=record.git_file_path,
            notion_url=record.notion_url,
            submission_url=record.submission_url,
        )

    def to_record_detail_out(self, record: models.Record) -> schemas.RecordDetailOut:
        problem_title = (
            record.problem.title if getattr(record, "problem", None) else None
        )
        problem_number = record.problem.id if getattr(record, "problem", None) else None
        return schemas.RecordDetailOut(
            id=record.id,
            user_id=record.user_id,
            problem_id=record.problem_id,
            problem_title=problem_title,
            problem_number=problem_number,
            oj_type=record.oj_type,
            execution_result=record.execution_result,
            language=record.language,
            code=record.code,
            submit_time=record.submit_time,
            runtime=record.runtime,
            memory=record.memory,
            runtime_percentile=record.runtime_percentile,
            memory_percentile=record.memory_percentile,
            total_correct=record.total_correct,
            total_testcases=record.total_testcases,
            topic_tags=record.topic_tags,
            ai_analysis=record.ai_analysis,
            oj_sync_status=record.oj_sync_status,
            github_sync_status=record.github_sync_status,
            ai_sync_status=record.ai_sync_status,
            submission_url=record.submission_url,
            notion_url=record.notion_url,
            git_file_path=record.git_file_path,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )

    def create_leetcode_problem(
        self, problem_data: schemas.LeetCodeProblemCreate
    ) -> models.LeetCodeProblem:
        """Create a new LeetCode problem entry."""
        db_problem = models.LeetCodeProblem(
            id=problem_data.id,
            title=problem_data.title,
            difficulty=problem_data.difficulty,
            topic_tags=problem_data.topic_tags,
            content=problem_data.content,
            title_slug=problem_data.title_slug,
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
