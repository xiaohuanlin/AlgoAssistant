from typing import Optional

from app.celery_app import celery_app
from app.deps import get_db
from app.models import Record, SyncTask
from app.schemas.record import SyncStatus
from app.services.notion_service import NotionService
from app.services.sync_task_service import SyncTaskService
from app.services.user_config_service import UserConfigService
from app.utils.logger import get_logger

logger = get_logger("notion_sync")


@celery_app.task
def notion_sync_task(task_id: int):
    """Celery task for syncing records to Notion."""
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

        if not sync_task_service.can_start(task_id):
            logger.info(
                f"Sync task {task_id} is not in pending or retry status, skipping processing"
            )
            return

        config = user_config_service.get(sync_task.user_id)
        notion_config = (
            config.notion_config if config and config.notion_config else None
        )

        if not notion_config:
            logger.error(f"Notion config not found for user {sync_task.user_id}")
            sync_task_service.update(
                task_id,
                status=SyncStatus.FAILED.value,
                synced_records=0,
                failed_records=0,
            )
            return

        notion_service = NotionService(notion_config)
        record_ids = sync_task.record_ids or []
        if not record_ids:
            logger.info(f"Sync task {task_id} has no record ids, skipping processing")
            return

        records = (
            db.query(Record)
            .filter(
                Record.id.in_(record_ids),
                Record.user_id == sync_task.user_id,
                Record.notion_sync_status.in_(
                    [SyncStatus.PENDING.value, SyncStatus.FAILED.value]
                ),
            )
            .all()
        )

        if not records:
            logger.info(f"No records to process for task {task_id}")
            sync_task_service.update(
                task_id,
                status=SyncStatus.COMPLETED.value,
                synced_records=0,
                failed_records=0,
            )
            return

        for record in records:
            try:
                record.notion_sync_status = SyncStatus.RUNNING.value
                db.commit()

                # Create new page directly from record
                success, result = notion_service.create_page_from_record(record)

                if not success:
                    logger.error(f"Notion sync failed for record {record.id}: {result}")
                    record.notion_sync_status = SyncStatus.FAILED.value
                    failed_count += 1
                else:
                    record.notion_sync_status = SyncStatus.COMPLETED.value
                    if isinstance(result, dict):
                        record.notion_page_id = result.get("page_id")
                        record.notion_url = result.get("page_url")
                    sync_count += 1
                    logger.info(f"Successfully synced record {record.id}")

                db.commit()

            except Exception as e:
                logger.exception(f"Failed to process record {record.id}: {e}")
                record.notion_sync_status = SyncStatus.FAILED.value
                db.commit()
                failed_count += 1

        sync_task_service.update(
            task_id,
            status=SyncStatus.COMPLETED.value,
            synced_records=sync_count,
            failed_records=failed_count,
        )

        logger.info(
            f"Notion sync task {task_id} completed: {sync_count} successful, {failed_count} failed"
        )

    except Exception as e:
        logger.exception(f"Notion sync task {task_id} error: {e}")
        sync_task_service.update(
            task_id,
            status=SyncStatus.FAILED.value,
            synced_records=sync_count,
            failed_records=failed_count,
        )
    finally:
        db.close()
