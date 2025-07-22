from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import Record, SyncStatus, SyncTaskType
from app.schemas import SyncTaskCreate, SyncTaskOut
from app.services.sync_task_service import SyncTaskService
from app.tasks import TaskManager
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/sync_task", tags=["sync_task"])


@router.post("/", response_model=SyncTaskOut, status_code=status.HTTP_201_CREATED)
async def create_sync_task(
    task_data: SyncTaskCreate, user_id: int = 1, db: Session = Depends(get_db)
):
    sync_task_service = SyncTaskService(db)

    if task_data.type not in [t.value for t in SyncTaskType]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid task type. Must be one of: {[t.value for t in SyncTaskType]}",
        )

    try:
        create_kwargs = dict(
            user_id=user_id, type=task_data.type, record_ids=task_data.record_ids
        )
        if task_data.type == "leetcode_batch_sync" and task_data.total_records:
            create_kwargs["total_records"] = task_data.total_records
        elif task_data.record_ids:
            create_kwargs["total_records"] = len(task_data.record_ids)
        sync_task = sync_task_service.create(**create_kwargs)

        task_manager = TaskManager()
        success = task_manager.start_sync_task(sync_task)
        if success:
            logger.info(f"Sync task {sync_task.id} started")
        else:
            logger.error(f"Failed to start sync task {sync_task.id}")
            sync_task_service.update(sync_task.id, status=SyncStatus.FAILED.value)

        return SyncTaskOut.from_orm(sync_task)

    except Exception as e:
        logger.exception(f"Failed to create sync task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create sync task",
        )


@router.get("/", response_model=List[SyncTaskOut])
async def list_sync_tasks(
    user_id: int = 1, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    sync_task_service = SyncTaskService(db)
    tasks = sync_task_service.list(user_id=user_id, limit=limit, offset=skip)
    return [SyncTaskOut.from_orm(task) for task in tasks]


@router.get("/{task_id}", response_model=SyncTaskOut)
async def get_sync_task(task_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    sync_task_service = SyncTaskService(db)
    task = sync_task_service.get(task_id)

    if not task or task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sync task not found"
        )

    return SyncTaskOut.from_orm(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sync_task(
    task_id: int, user_id: int = 1, db: Session = Depends(get_db)
):
    sync_task_service = SyncTaskService(db)
    task = sync_task_service.get(task_id)

    if not task or task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sync task not found"
        )

    try:
        sync_task_service.delete(task_id)
    except Exception as e:
        logger.exception(f"Failed to delete sync task {task_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete sync task",
        )


@router.post("/{task_id}/pause", response_model=SyncTaskOut)
async def pause_sync_task(
    task_id: int, user_id: int = 1, db: Session = Depends(get_db)
):
    sync_task_service = SyncTaskService(db)
    task = sync_task_service.get(task_id)
    if not task or task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sync task not found"
        )
    if task.status not in [SyncStatus.PENDING.value, SyncStatus.RUNNING.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Task cannot be paused"
        )
    sync_task_service.update(task_id, status=SyncStatus.PAUSED.value)
    return SyncTaskOut.from_orm(sync_task_service.get(task_id))


@router.post("/{task_id}/resume", response_model=SyncTaskOut)
async def resume_sync_task(
    task_id: int, user_id: int = 1, db: Session = Depends(get_db)
):
    sync_task_service = SyncTaskService(db)
    task = sync_task_service.get(task_id)
    if not task or task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sync task not found"
        )
    if task.status != SyncStatus.PAUSED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Task is not paused"
        )
    sync_task_service.update(task_id, status=SyncStatus.PENDING.value)
    task_manager = TaskManager()
    task_manager.start_sync_task(sync_task_service.get(task_id))
    return SyncTaskOut.from_orm(sync_task_service.get(task_id))


@router.post("/{task_id}/retry", response_model=SyncTaskOut)
async def retry_sync_task(
    task_id: int, user_id: int = 1, db: Session = Depends(get_db)
):
    sync_task_service = SyncTaskService(db)
    task = sync_task_service.get(task_id)
    if not task or task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sync task not found"
        )
    if task.status not in [SyncStatus.FAILED.value, SyncStatus.PAUSED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Task cannot be retried"
        )
    sync_task_service.update(task_id, status=SyncStatus.PENDING.value)
    task_manager = TaskManager()
    task_manager.start_sync_task(sync_task_service.get(task_id))
    return SyncTaskOut.from_orm(sync_task_service.get(task_id))


@router.get("/{task_id}/review-candidates")
async def get_review_candidates(
    task_id: int, user_id: int = 1, db: Session = Depends(get_db)
):
    """Get records that need review from a completed sync task and auto-generate reviews for failed submissions."""
    sync_task_service = SyncTaskService(db)
    task = sync_task_service.get(task_id)

    if not task or task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sync task not found"
        )

    if task.status != SyncStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sync task must be completed to get review candidates",
        )

    if not task.record_ids:
        return {"task_id": task_id, "candidates": []}

    candidates = []
    for record_id in task.record_ids:
        record = db.query(Record).filter(Record.id == record_id).first()
        if record and record.execution_result != "Accepted":
            candidates.append(
                {
                    "record_id": record.id,
                    "problem_id": record.problem_id,
                    "title": record.problem.title if record.problem else "Unknown",
                    "execution_result": record.execution_result,
                    "submitted_at": record.submit_time.isoformat()
                    if record.submit_time
                    else None,
                    "language": record.language,
                }
            )

    return {"task_id": task_id, "candidates": candidates}
