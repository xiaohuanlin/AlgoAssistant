from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import SyncStatus, SyncTask, SyncTaskType
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
        sync_task = sync_task_service.create(
            user_id=user_id, type=task_data.type, record_ids=task_data.record_ids
        )

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
