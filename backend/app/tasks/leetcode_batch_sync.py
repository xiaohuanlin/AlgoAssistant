from typing import Optional

from app import schemas
from app.celery_app import celery_app
from app.deps import get_db, get_redis_client
from app.models import LeetCodeProblem, OJType, Record, SyncStatus, SyncTask
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
        config = user_config_service.get(sync_task.user_id)
        leetcode_config = (
            config.leetcode_config if config and config.leetcode_config else None
        )
        if not leetcode_config:
            logger.error(f"LeetCode config not found for user {sync_task.user_id}")
            return
        service = LeetCodeService(leetcode_config)
        if sync_task.total_records:
            submissions = service.fetch_user_submissions(
                max_submissions=sync_task.total_records
            )
        else:
            submissions = service.fetch_user_submissions()
        sync_task.status = SyncStatus.RUNNING.value
        sync_task_service.update(task_id, status=SyncStatus.RUNNING.value)
        for batch in submissions:
            for submission in batch:
                record_id = submission["submission_id"]
                record = record_service.get_record(int(record_id))
                if record:
                    logger.warning(f"Record {record_id} already exists")
                    sync_count += 1
                    continue
                try:
                    leetcode_problem: Optional[
                        LeetCodeProblem
                    ] = record_service.get_leetcode_problem(
                        submission["problem_title_slug"]
                    )

                    if not leetcode_problem:
                        problem = service.fetch_problem_detail(
                            submission["problem_title_slug"]
                        )
                        if not problem:
                            logger.error(
                                f"LeetCode problem {submission['problem_title_slug']} not found"
                            )
                            continue
                        leetcode_problem = record_service.create_leetcode_problem(
                            schemas.LeetCodeProblemCreate(
                                id=problem["id"],
                                title=problem["title"],
                                title_slug=problem["title_slug"],
                                difficulty=problem["difficulty"],
                                topic_tags=problem["topic_tags"],
                                content=problem["content"],
                            )
                        )

                    record_service.create_record(
                        sync_task.user_id,
                        schemas.RecordCreate(
                            problem_id=leetcode_problem.id,
                            oj_type=OJType.leetcode.value,
                            execution_result=submission["status"],
                            language=submission["language"],
                            submit_time=submission["submit_time"],
                            runtime=submission["runtime"],
                            memory=submission["memory"],
                            submission_id=submission["submission_id"],
                            submission_url=submission["submission_url"],
                        ),
                    )
                    sync_count += 1
                except Exception as e:
                    logger.exception(
                        f"[LeetCodeBatchSyncTask] Record {record_id} failed to create: {e}"
                    )
                    failed_count += 1
                logger.info(f"[LeetCodeBatchSyncTask] Record {record_id} synced.")
            sync_task_service.update(
                task_id, synced_records=sync_count, failed_records=failed_count
            )
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
