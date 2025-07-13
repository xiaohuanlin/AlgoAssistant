import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.celery_app import celery_app
from app.deps import get_db, get_redis_client
from app.models import Record, SyncStatus, SyncTask
from app.schemas.github import GitHubConfig, GitHubSyncStatus
from app.services.github_service import GitHubService
from app.services.sync_task_service import SyncTaskService
from app.services.user_config_service import UserConfigService
from app.utils.logger import get_logger
from app.utils.rate_limiter import get_global_rate_limiter

logger = get_logger("github_sync")


class GitHubSyncTask:
    def __init__(self, db, config: GitHubConfig):
        self.db = db
        self.config = config
        self.service = GitHubService(config)

    def _get_file_extension(self, language: str) -> str:
        """Get file extension based on programming language."""
        language_extensions = {
            "python": "py",
            "python3": "py",
            "java": "java",
            "javascript": "js",
            "typescript": "ts",
            "cpp": "cpp",
            "c": "c",
            "csharp": "cs",
            "go": "go",
            "rust": "rs",
            "swift": "swift",
            "kotlin": "kt",
            "scala": "scala",
            "php": "php",
            "ruby": "rb",
            "r": "r",
            "sql": "sql",
            "bash": "sh",
            "shell": "sh",
        }
        return language_extensions.get(language.lower(), "txt")

    def _generate_file_path(
        self,
        problem_title: str,
        language: str,
        submit_time: datetime,
        id: Optional[int] = None,
    ) -> str:
        """Generate file path based on configuration and problem details."""
        # Create safe directory name from problem title
        safe_title = "".join(
            c for c in problem_title.lower() if c.isalnum() or c in (" ", "-", "_")
        ).rstrip()
        safe_title = safe_title.replace(" ", "-")

        # Generate timestamp
        date_str = submit_time.strftime("%Y%m%d")
        time_str = submit_time.strftime("%H%M%S")

        # Get file extension
        ext = self._get_file_extension(language)

        # Build path - ensure no leading slash and no double slashes
        base_path = self.config.base_path.strip("/")

        # Add id prefix if provided for better ordering
        if id:
            safe_title = f"{id:04d}-{safe_title}"

        file_template = self.config.file_template
        if file_template:
            file_path = file_template.format(
                date=date_str,
                time=time_str,
                problem_title=safe_title,
                language=language,
                ext=ext,
            )
        else:
            file_path = f"{safe_title}/solution_{date_str}_{time_str}.{ext}"
        path = f"{base_path}/{file_path}"

        # Ensure no leading slash
        if path.startswith("/"):
            path = path[1:]

        return path

    def prepare_files_data(self, records: List[Record]) -> List[Dict[str, str]]:
        files_data = []
        for record in records:
            problem_title = record.problem.title if record.problem else str(record.id)
            file_path = self._generate_file_path(
                problem_title, record.language, record.submit_time, record.id
            )
            code = record.code
            content = self._format_code_content(
                record.language, problem_title, record.problem.description, code
            )
            files_data.append({"file_path": file_path, "code": content})
        return files_data

    def _format_code_content(
        self, language: str, problem_title: str, problem_description: str, code: str
    ) -> str:
        language = language.lower()
        if language in ["python", "python3"]:
            return f'"""\n{problem_title}\n\n{problem_description}\n\nLeetCode Problem\n"""\n\n{code}\n\n# Test cases\nif __name__ == "__main__":\n    # Add your test cases here\n    pass\n'
        elif language == "java":
            class_name = "Solution"
            class_match = re.search(r"class\s+(\w+)", code)
            if class_match:
                class_name = class_match.group(1)
            return f"""/**\n * {problem_title}\n *\n * {problem_description}\n *\n * LeetCode Problem\n */\n\n{code}\n\n// Test class\nclass Main {{\n    public static void main(String[] args) {{\n        // Add your test cases here\n        {class_name} solution = new {class_name}();\n    }}\n}}\n"""
        elif language in ["cpp", "c++"]:
            return f"""/**\n * {problem_title}\n *\n * {problem_description}\n *\n * LeetCode Problem\n */\n\n#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\n{code}\n\n// Test function\nint main() {{\n    // Add your test cases here\n    return 0;\n}}\n"""
        else:
            comment_symbol = "#" if language in ["python", "python3"] else "//"
            return f"{comment_symbol} {problem_title}\n{comment_symbol}\n{comment_symbol} {problem_description}\n{comment_symbol}\n{comment_symbol} LeetCode Problem\n\n{code}\n"

    def _generate_commit_message(
        self, problem_title: str, submit_time: datetime
    ) -> str:
        """Generate commit message based on template."""
        date_str = submit_time.strftime("%Y%m%d")
        # Add last_commit_date_inc_1_day variable
        last_commit_date_inc_1_day = self._generate_incremental_date("%Y%m%d")
        return self.config.commit_template.format(
            problem_title=problem_title,
            date=date_str,
            last_commit_date_inc_1_day=last_commit_date_inc_1_day,
        )

    def _get_last_commit_date(self) -> Optional[datetime]:
        """
        Parse date from the latest commit message.
        Parse date information according to the current commit template format.
        """
        commit_message = self.service.get_lastest_commit(self.config)
        if not commit_message:
            return None

        date_pattern = r"(\d{8})"
        match = re.search(date_pattern, commit_message)
        if match:
            date_str = match.group(1)
            try:
                return datetime.strptime(date_str, "%Y%m%d")
            except ValueError:
                pass
            logger.info("No date found in commit message")
        return None

    def _generate_incremental_date(self, template: str) -> str:
        """
        Generate incremental date based on template and last commit.

        Args:
            template: Date template string

        Returns:
            str: Generated date string
        """
        last_commit_date = self._get_last_commit_date()
        if last_commit_date:
            # Add one day to last commit date
            next_date = last_commit_date.date()
            next_date = next_date + timedelta(days=1)
        else:
            # Use current date if no previous commits
            next_date = datetime.now().date()

        return next_date.strftime(template)

    def run(self, sync_task: SyncTask, records: List[Record]):
        files_data = self.prepare_files_data(records)
        if not files_data:
            logger.info(f"No files to push for task {sync_task.id}")
            return False
        commit_message = self._generate_commit_message(
            records[0].problem.title, records[0].submit_time
        )
        try:
            url = self.service.push_files(files_data, commit_message, self.config)
            for record in records:
                record.git_file_path = url
            self.db.commit()
            logger.info(
                f"[GitHubSyncTask] Task {sync_task.id} completed. Commit: {url}"
            )
            return True
        except Exception as e:
            logger.exception(f"[GitHubSyncTask] Task {sync_task.id} failed: {e}")
            return False


@celery_app.task
def github_sync_task(task_id: int):
    db = next(get_db())
    redis_client = next(get_redis_client())
    limiter = get_global_rate_limiter(redis_client)
    sync_task_service = SyncTaskService(db)
    user_config_service = UserConfigService(db)
    try:
        sync_task: Optional[SyncTask] = sync_task_service.get(task_id)
        if not sync_task:
            logger.error(f"Sync task {task_id} not found")
            return
        user_id = sync_task.user_id
        record_ids = sync_task.record_ids or []
        if not record_ids:
            logger.info(f"Sync task {task_id} has no record ids, skipping processing")
            return
        if not sync_task_service.can_start(task_id):
            logger.info(
                f"Sync task {task_id} is in state '{sync_task.status}', skipping processing"
            )
            return
        limiter.wait_if_needed(0, 1, 1, "github")
        config = user_config_service.get_github_config(user_id)
        if not config:
            logger.error(f"GitHub config not found for user {user_id}")
            return
        records = (
            db.query(Record)
            .filter(
                Record.id.in_(record_ids),
                Record.user_id == user_id,
                Record.oj_status.in_(
                    [SyncStatus.PENDING.value, SyncStatus.RETRY.value]
                ),
            )
            .all()
        )
        sync = GitHubSyncTask(db, config)
        success = sync.run(sync_task, records)
        if success:
            sync_task_service.update(
                task_id,
                status=SyncStatus.COMPLETED.value,
                synced_records=len(records),
                failed_records=0,
            )
        else:
            sync_task_service.update(
                task_id,
                status=SyncStatus.FAILED.value,
                synced_records=0,
                failed_records=len(records),
            )
    except Exception as e:
        logger.exception(f"[GitHubSyncTask] Task {task_id} error: {e}")
    finally:
        db.close()
