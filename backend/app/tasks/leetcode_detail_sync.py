from typing import Optional

from app.celery_app import celery_app
from app.deps import get_db
from app.models import Record, SyncStatus, SyncTask
from app.services.leetcode_service import LeetCodeService
from app.services.sync_task_service import SyncTaskService
from app.services.user_config_service import UserConfigService
from app.utils.logger import get_logger

logger = get_logger("leetcode_detail_sync")


@celery_app.task
def leetcode_detail_sync_task(task_id: int):
    db = next(get_db())
    sync_task_service = SyncTaskService(db)
    user_config_service = UserConfigService(db)
    sync_count = 0
    failed_count = 0
    try:
        sync_task: Optional[SyncTask] = sync_task_service.get(task_id)
        if not sync_task:
            logger.error(f"Sync task {task_id} not found")
            return
        record_ids = sync_task.record_ids or []
        if not record_ids:
            logger.info(f"Sync task {task_id} has no record ids, skipping processing")
            return
        if not sync_task_service.can_start(task_id):
            logger.info(
                f"Sync task {task_id} is not in pending or retry status, skipping processing"
            )
            return
        config = user_config_service.get(sync_task.user_id)
        leetcode_config = (
            config.leetcode_config if config and config.leetcode_config else None
        )
        if not leetcode_config:
            logger.error(f"LeetCode config not found for user {sync_task.user_id}")
            return
        service = LeetCodeService(leetcode_config)
        for record_id in record_ids:
            record = (
                db.query(Record)
                .filter(
                    Record.id == record_id,
                    Record.oj_sync_status.in_(
                        [SyncStatus.PENDING.value, SyncStatus.FAILED.value]
                    ),
                )
                .first()
            )
            if not record:
                logger.warning(f"Record {record_id} not found")
                continue
            try:
                detail = service.fetch_user_submissions_detail(record.submission_id)
                if detail:
                    record.code = detail["code"]
                    record.runtime_percentile = detail["runtime_percentile"]
                    record.memory_percentile = detail["memory_percentile"]
                    record.total_correct = detail["total_correct"]
                    record.total_testcases = detail["total_testcases"]
                    record.topic_tags = detail["topic_tags"]
                    record.oj_sync_status = SyncStatus.COMPLETED.value
                    db.commit()
                    logger.info(f"[LeetCodeDetailSyncTask] Record {record_id} synced.")
                    sync_count += 1
                else:
                    record.oj_sync_status = SyncStatus.FAILED.value
                    db.commit()
                    logger.warning(
                        f"[LeetCodeDetailSyncTask] No detail for record {record_id}"
                    )
            except Exception as e:
                record.oj_sync_status = SyncStatus.FAILED.value
                db.commit()
                logger.exception(
                    f"[LeetCodeDetailSyncTask] Record {record_id} failed: {e}"
                )
                failed_count += 1
        sync_task_service.update(
            task_id,
            status=SyncStatus.COMPLETED.value,
            synced_records=sync_count,
            failed_records=failed_count,
        )
    except Exception as e:
        logger.exception(f"[LeetCodeDetailSyncTask] Task {task_id} error: {e}")
        sync_task_service.update(
            task_id,
            status=SyncStatus.FAILED.value,
            synced_records=sync_count,
            failed_records=failed_count,
        )
    finally:
        db.close()
