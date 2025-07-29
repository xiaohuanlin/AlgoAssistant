from typing import Optional

from app.celery_app import celery_app
from app.deps import get_db
from app.models import Record, SyncStatus, SyncTask
from app.schemas.gemini import AIAnalysisStatus
from app.services.gemini_service import GeminiService
from app.services.sync_task_service import SyncTaskService
from app.services.user_config_service import UserConfigService
from app.utils.logger import get_logger

logger = get_logger("gemini_sync")


@celery_app.task
def gemini_sync_task(task_id: int):
    """Celery task for Gemini AI analysis synchronization."""
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
        gemini_config = (
            config.gemini_config if config and config.gemini_config else None
        )
        if not gemini_config:
            logger.error(f"Gemini config not found for user {sync_task.user_id}")
            sync_task_service.update(
                task_id,
                status=SyncStatus.FAILED.value,
                synced_records=0,
                failed_records=0,
            )
            return
        gemini_service = GeminiService(gemini_config)
        record_ids = sync_task.record_ids or []
        if not record_ids:
            logger.info(f"Sync task {task_id} has no record ids, skipping processing")
            return
        records = (
            db.query(Record)
            .filter(
                Record.id.in_(record_ids),
                Record.user_id == sync_task.user_id,
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
                record.ai_sync_status = SyncStatus.RUNNING.value
                db.commit()
                success, analysis_result = gemini_service.analyze_code(
                    code=record.code,
                    problem_description=record.problem.description,
                    language=record.language,
                )
                if not success:
                    logger.error(
                        f"Gemini analysis failed for record {record.id}: {analysis_result['error']}"
                    )
                    record.ai_sync_status = SyncStatus.FAILED.value
                    failed_count += 1
                else:
                    record.ai_sync_status = SyncStatus.COMPLETED.value
                    record.ai_analysis = analysis_result
                    
                    # Extract and backfill topic_tags from AI analysis
                    if "topic_tags" in analysis_result and analysis_result["topic_tags"]:
                        record.topic_tags = analysis_result["topic_tags"]
                        logger.info(f"Backfilled {len(analysis_result['topic_tags'])} topic tags for record {record.id}: {analysis_result['topic_tags']}")
                    
                    sync_count += 1
                    logger.info(f"Successfully analyzed record {record.id}")
                db.commit()
            except Exception as e:
                logger.exception(f"Failed to process record {record.id}: {e}")
                record.ai_sync_status = SyncStatus.FAILED.value
                db.commit()
                failed_count += 1
        sync_task_service.update(
            task_id,
            status=SyncStatus.COMPLETED.value,
            synced_records=sync_count,
            failed_records=failed_count,
        )
        logger.info(
            f"Gemini sync task {task_id} completed: {sync_count} successful, {failed_count} failed"
        )
    except Exception as e:
        logger.exception(f"Gemini sync task {task_id} error: {e}")
        sync_task_service.update(
            task_id,
            status=SyncStatus.FAILED.value,
            synced_records=sync_count,
            failed_records=failed_count,
        )
    finally:
        db.close()
