from typing import Optional

from app import schemas
from app.celery_app import celery_app
from app.deps import get_db, get_redis_client
from app.models import OJType, Record, SyncStatus, SyncTask
from app.services.leetcode_service import LeetCodeService
from app.services.record_service import RecordService
from app.services.sync_task_service import SyncTaskService
from app.services.user_config_service import UserConfigService
from app.utils.logger import get_logger
from app.utils.rate_limiter import get_global_rate_limiter

logger = get_logger("leetcode_batch_sync")


@celery_app.task
def leetcode_batch_sync_task(task_id: int):
    db = next(get_db())
    redis_client = next(get_redis_client())
    limiter = get_global_rate_limiter(redis_client)
    sync_task_service = SyncTaskService(db)
    user_config_service = UserConfigService(db)
    record_service = RecordService(db)
    sync_count = 0
    failed_count = 0
    try:
        sync_task: Optional[SyncTask] = sync_task_service.get(task_id)
        if not sync_task:
            logger.error(f"Sync task {task_id} not found")
            return
        if not sync_task_service.can_start(task_id):
            logger.info(
                f"Sync task {task_id} is not in pending or retry status, skipping processing"
            )
            return
        limiter.wait_if_needed(0, 1, 1, "leetcode")
        leetcode_config = user_config_service.get_leetcode_config(sync_task.user_id)
        if not leetcode_config:
            logger.error(f"LeetCode config not found for user {sync_task.user_id}")
            return
        service = LeetCodeService(leetcode_config)
        submissions = service.fetch_user_submissions()
        for batch in submissions:
            for submission in batch:
                record_id = submission["submission_id"]
                record = record_service.get_record(int(record_id))
                if record:
                    logger.warning(f"Record {record_id} already exists")
                    continue
                try:
                    record_service.create_record(
                        sync_task.user_id,
                        schemas.RecordCreate(
                            oj_type=OJType.leetcode,
                            problem_title=submission["problem_title"],
                            language=submission["language"],
                            submit_time=submission["submit_time"],
                            runtime=submission["runtime"],
                            memory=submission["memory"],
                            code="",
                            topic_tags=[],
                            status=submission["status"],
                            sync_status=SyncStatus.PENDING.value,
                            submission_url=submission["submission_url"],
                        ),
                    )
                    if not record_service.get_leetcode_problem(
                        submission["problem_title_slug"]
                    ):
                        leetcode_problem = service.fetch_problem_detail(
                            submission["problem_title_slug"]
                        )
                        if not leetcode_problem:
                            logger.error(
                                f"LeetCode problem {submission['problem_title_slug']} not found"
                            )
                            continue
                        record_service.create_leetcode_problem(
                            schemas.LeetCodeProblemCreate(
                                title=leetcode_problem["title"],
                                title_slug=leetcode_problem["title_slug"],
                                difficulty=leetcode_problem["difficulty"],
                                topic_tags=leetcode_problem["topic_tags"],
                                content=leetcode_problem["content"],
                                url=leetcode_problem["url"],
                            )
                        )
                    sync_count += 1
                except Exception as e:
                    logger.exception(
                        f"[LeetCodeBatchSyncTask] Record {record_id} failed to create: {e}"
                    )
                    failed_count += 1
                logger.info(f"[LeetCodeBatchSyncTask] Record {record_id} synced.")
        sync_task_service.update(
            task_id,
            status=SyncStatus.COMPLETED.value,
            synced_records=sync_count,
            failed_records=failed_count,
        )
    except Exception as e:
        logger.exception(f"[LeetCodeBatchSyncTask] Task {task_id} error: {e}")
        sync_task_service.update(
            task_id,
            status=SyncStatus.FAILED.value,
            synced_records=sync_count,
            failed_records=failed_count,
        )
    finally:
        db.close()
