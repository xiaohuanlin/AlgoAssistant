from typing import Optional

from app import schemas
from app.celery_app import celery_app
from app.deps import get_db, get_redis_client
from app.models import OJType, SyncStatus, SyncTask
from app.services.leetcode_service import LeetCodeService
from app.services.problem_service import ProblemService
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
    problem_service = ProblemService(db)
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
        early_stop = False
        for batch in submissions:
            for submission in batch:
                record_id = submission["submission_id"]
                record = record_service.get_record(int(record_id))
                if record:
                    logger.info(
                        f"Record {record_id} already exists, stopping sync as subsequent records are likely synced"
                    )
                    early_stop = True
                    break
                try:
                    problem = problem_service.get_problem_by_title_slug(
                        submission["problem_title_slug"]
                    )
                    if not problem:
                        problem = problem_service.create_problem(
                            schemas.ProblemCreate(
                                source=schemas.ProblemSource.leetcode,
                                url=f"https://leetcode.com/problems/{submission['problem_title_slug']}/",
                            ),
                            user=sync_task.user,
                        )
                    detail = service.fetch_user_submissions_detail(int(record_id))
                    new_record = record_service.create_record(
                        sync_task.user_id,
                        schemas.RecordCreate(
                            problem_id=problem.id,
                            oj_type=OJType.leetcode.value,
                            oj_sync_status=SyncStatus.COMPLETED.value,
                            execution_result=submission["status"],
                            language=submission["language"],
                            code=detail.get("code"),
                            submit_time=submission["submit_time"],
                            runtime=submission["runtime"],
                            memory=submission["memory"],
                            runtime_percentile=detail.get("runtime_percentile"),
                            memory_percentile=detail.get("memory_percentile"),
                            total_correct=detail.get("total_correct"),
                            total_testcases=detail.get("total_testcases"),
                            topic_tags=detail.get("topic_tags"),
                            submission_id=submission["submission_id"],
                            submission_url=submission["submission_url"],
                        ),
                    )
                    if not detail:
                        new_record.oj_sync_status = SyncStatus.FAILED.value
                        db.commit()
                    sync_count += 1
                except Exception as e:
                    logger.exception(
                        f"[LeetCodeBatchSyncTask] Record {record_id} failed to create: {e}"
                    )
                    failed_count += 1
                logger.info(f"[LeetCodeBatchSyncTask] Record {record_id} synced.")
            if early_stop:
                logger.info(
                    "[LeetCodeBatchSyncTask] Early stop triggered, ending sync process"
                )
                break
            sync_task_service.update(
                task_id, synced_records=sync_count, failed_records=failed_count
            )
        final_status = "COMPLETED_EARLY_STOP" if early_stop else "COMPLETED"
        sync_task_service.update(
            task_id,
            status=SyncStatus.COMPLETED.value,
            synced_records=sync_count,
            failed_records=failed_count,
        )
        logger.info(
            f"[LeetCodeBatchSyncTask] Task {task_id} finished with status: {final_status}, synced: {sync_count}, failed: {failed_count}"
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
