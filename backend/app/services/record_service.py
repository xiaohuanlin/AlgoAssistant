from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app import models, schemas
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class RecordService:
    """Service for problem record business logic."""
    def __init__(self, db: Session):
        self.db = db

    def create_record(self, user_id: int, record_data: schemas.RecordCreate) -> models.Record:
        """Create a new problem record."""
        db_record = models.Record(
            user_id=user_id,
            oj_type=record_data.oj_type,
            problem_title=record_data.problem_title,
            status=record_data.status,
            language=record_data.language,
            code=record_data.code,
            submit_time=record_data.submit_time or None
        )
        self.db.add(db_record)
        self.db.commit()
        self.db.refresh(db_record)
        return db_record

    def get_record(self, user_id: int, submission_id: int) -> Optional[models.Record]:
        """Get a single problem record by submission_id for a user."""
        return self.db.query(models.Record).filter(
            models.Record.user_id == user_id, 
            models.Record.submission_id == submission_id
        ).first()

    def create_record_from_leetcode_submission(self, user_id: int, submission: Dict[str, Any]) -> models.Record:
        """Create a new problem record from LeetCode submission data."""
        # Check if record already exists based on submission_id
        if submission.get("submission_id"):
            exists = self.db.query(models.Record).filter(
                models.Record.user_id == user_id,
                models.Record.submission_id == submission["submission_id"]
            ).first()
            if exists:
                logger.debug(f"Record already exists for submission {submission['submission_id']}")
                return exists
        
        # Parse submit_time if it's a string
        submit_time = submission.get("submit_time")
        if isinstance(submit_time, str):
            try:
                from datetime import datetime
                submit_time = datetime.fromisoformat(submit_time.replace('Z', '+00:00'))
            except Exception as e:
                logger.warning(f"Failed to parse submit_time {submit_time}: {e}")
                submit_time = None
        
        db_record = models.Record(
            user_id=user_id,
            oj_type=submission.get("oj_type", "leetcode"),
            submission_id=submission["submission_id"],
            problem_title=submission["problem_title"],
            status=submission["status"],
            sync_status=submission.get("sync_status", "pending"),
            language=submission["language"],
            code=submission["code"],
            submit_time=submit_time,
            runtime=submission.get("runtime"),
            memory=submission.get("memory"),
            submission_url=submission.get("submission_url"),
            topic_tags=submission.get("topic_tags", [])
        )
        self.db.add(db_record)
        self.db.commit()
        self.db.refresh(db_record)
        return db_record

    def get_records(self, user_id: int) -> List[models.Record]:
        """Get all problem records for a user."""
        return self.db.query(models.Record).filter(
            models.Record.user_id == user_id
        ).order_by(
            models.Record.submit_time.desc().nullslast(),
            models.Record.created_at.desc()
        ).all()

    def analyze_record_with_ai(self, record: models.Record, ai_service) -> Dict[str, Any]:
        """Analyze a problem record with AI service and update the record."""
        ai_result = ai_service.analyze_code(
            code=record.code,
            problem_description=record.problem_title,
            language=record.language
        )
        record.ai_analysis = ai_result
        self.db.commit()
        self.db.refresh(record)
        return ai_result

    def sync_records_from_oj(self, user_id: int, oj_service, leetcode_username: str, session_cookie: str = None) -> models.SyncLog:
        """Sync problem records from OJ platform for a user. Log the sync event and return SyncLog."""
        from app.services.leetcode_crawler import LeetCodeCrawler
        
        # Use crawler for detailed submissions
        crawler = LeetCodeCrawler(session_cookie)
        submissions = crawler.get_all_submissions(leetcode_username)
        
        new_record_ids = []
        for sub in submissions:
            # Check if record already exists based on submission_id if available
            if sub.get("submission_id"):
                exists = self.db.query(models.Record).filter(
                    models.Record.user_id == user_id,
                    models.Record.submission_id == sub["submission_id"]
                ).first()
            else:
                # Fallback to old method if no submission_id
                exists = self.db.query(models.Record).filter(
                    models.Record.user_id == user_id,
                    models.Record.oj_type == sub.get("oj_type", "leetcode"),
                    models.Record.submit_time == sub["submit_time"]
                ).first()
            
            if not exists:
                db_record = models.Record(
                    user_id=user_id,
                    oj_type=sub.get("oj_type", "leetcode"),
                    submission_id=sub["submission_id"],
                    problem_title=sub["problem_title"],
                    status=sub["status"],
                    language=sub["language"],
                    code=sub["code"],
                    submit_time=sub["submit_time"],
                    runtime=sub.get("runtime"),
                    memory=sub.get("memory"),
                    submission_url=sub.get("submission_url"),
                    topic_tags=sub.get("topic_tags", [])
                )
                self.db.add(db_record)
                self.db.flush()  # Get submission_id before commit
                new_record_ids.append(db_record.submission_id)
        
        self.db.commit()
        sync_log = models.SyncLog(
            user_id=user_id,
            oj_type="leetcode",
            sync_time=datetime.utcnow(),
            record_count=len(new_record_ids),
            record_ids=new_record_ids,
            summary=f"Synced {len(new_record_ids)} new records with detailed information."
        )
        self.db.add(sync_log)
        self.db.commit()
        self.db.refresh(sync_log)
        return sync_log

    def batch_analyze_records_with_ai(self, user_id: int, ai_service) -> List[Dict[str, Any]]:
        """Batch analyze all unanalyzed records for a user with AI service."""
        records = self.db.query(models.Record).filter(
            models.Record.user_id == user_id,
            models.Record.ai_analysis == None
        ).all()
        results = []
        for record in records:
            ai_result = ai_service.analyze_code(
                code=record.code,
                user_id=user_id,
                problem_description=record.problem_title,
                language=record.language
            )
            record.ai_analysis = ai_result
            self.db.commit()
            self.db.refresh(record)
            results.append({"submission_id": record.submission_id, "ai_analysis": ai_result})
        return results

    def to_record_out(self, record: models.Record) -> schemas.RecordOut:
        """Convert a Record model to RecordOut schema, with analyzed flag."""
        return schemas.RecordOut(
            user_id=record.user_id,
            oj_type=record.oj_type,
            submission_id=record.submission_id,
            problem_title=record.problem_title,
            status=record.status,
            sync_status=record.sync_status,
            language=record.language,
            code=record.code,
            submit_time=record.submit_time,
            runtime=record.runtime,
            memory=record.memory,
            submission_url=record.submission_url,
            topic_tags=record.topic_tags,
            ai_analysis=record.ai_analysis,
            analyzed=record.ai_analysis is not None,
            
            # Performance metrics
            runtime_percentile=record.runtime_percentile,
            memory_percentile=record.memory_percentile,
            
            # Test case information
            total_correct=record.total_correct,
            total_testcases=record.total_testcases,
            success_rate=record.success_rate,
            
            # Error and output information
            runtime_error=record.runtime_error,
            compile_error=record.compile_error,
            code_output=record.code_output,
            expected_output=record.expected_output,
            
            # External service information
            notion_url=record.notion_url,
            github_pushed=record.github_pushed,
            
            created_at=record.created_at,
            updated_at=record.updated_at
        )

    def add_tag(self, name: str, wiki: Optional[str] = None, notion_url: Optional[str] = None) -> models.Tag:
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

    def sync_record_to_notion(self, record: models.Record, notion_service) -> str:
        """Sync a record to Notion and update notion_url field, including tag Notion URLs as Relation."""
        tag_notion_urls = [tag.notion_url for tag in record.tags if tag.notion_url]
        notion_url = notion_service.sync_record({
            "submission_id": record.submission_id,
            "problem_title": record.problem_title,
            "status": record.status,
            "language": record.language,
            "code": record.code,
            "ai_analysis": record.ai_analysis,
            "tags": [tag.name for tag in record.tags],
            "tag_notion_urls": tag_notion_urls,
        })
        record.notion_url = notion_url
        self.db.commit()
        self.db.refresh(record)
        return notion_url

    def batch_sync_records_to_notion(self, user_id: int, notion_service) -> list:
        """Batch sync all records without notion_url to Notion, including tag Notion URLs as Relation."""
        records = self.db.query(models.Record).filter(models.Record.user_id == user_id, models.Record.notion_url == None).all()
        results = []
        for record in records:
            tag_notion_urls = [tag.notion_url for tag in record.tags if tag.notion_url]
            notion_url = notion_service.sync_record({
                "submission_id": record.submission_id,
                "problem_title": record.problem_title,
                "status": record.status,
                "language": record.language,
                "code": record.code,
                "ai_analysis": record.ai_analysis,
                "tags": [tag.name for tag in record.tags],
                "tag_notion_urls": tag_notion_urls,
            })
            record.notion_url = notion_url
            self.db.commit()
            self.db.refresh(record)
            results.append({"submission_id": record.submission_id, "notion_url": notion_url})
        return results

    def batch_sync_tags_to_notion(self, notion_service) -> list:
        """Batch sync all tags without notion_url to Notion. Return list of {tag_id, notion_url}."""
        tags = self.db.query(models.Tag).filter(models.Tag.notion_url == None).all()
        results = []
        for tag in tags:
            notion_url = notion_service.sync_tag({
                "id": tag.id,
                "name": tag.name,
                "wiki": tag.wiki,
            })
            tag.notion_url = notion_url
            self.db.commit()
            self.db.refresh(tag)
            results.append({"tag_id": tag.id, "notion_url": notion_url})
        return results

    def push_record_to_github(self, record: models.Record, github_service, repo_config: Dict[str, Any]) -> str:
        """Push a record's code to GitHub and update github_pushed field."""
        # Use submission_id as problem identifier
        problem_identifier = str(record.submission_id)
        file_path = f"Leetcode/{problem_identifier}.{record.language}"
        commit_message = datetime.now().strftime('%Y%m%d')
        github_url = github_service.push_code(file_path, record.code, commit_message, repo_config)
        record.github_pushed = datetime.utcnow()
        self.db.commit()
        self.db.refresh(record)
        return github_url

    def batch_push_records_to_github(self, user_id: int, github_service, repo_config: Dict[str, Any]) -> list:
        """Batch push all records without github_pushed to GitHub. Return list of {submission_id, github_url}."""
        records = self.db.query(models.Record).filter(models.Record.user_id == user_id, models.Record.github_pushed == None).all()
        results = []
        for record in records:
            github_url = self.push_record_to_github(record, github_service, repo_config)
            results.append({"submission_id": record.submission_id, "github_url": github_url})
        return results 