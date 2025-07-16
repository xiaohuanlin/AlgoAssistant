from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import SyncStatus, SyncTask


class SyncTaskService:
    """Service for SyncTask CURD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, type: str, total_records: int, **kwargs) -> SyncTask:
        sync_task = SyncTask(
            user_id=user_id, type=type, total_records=total_records, **kwargs
        )
        self.db.add(sync_task)
        self.db.commit()
        self.db.refresh(sync_task)
        return sync_task

    def can_start(self, task_id: int) -> bool:
        sync_task = self.get(task_id)
        if not sync_task:
            return False
        if sync_task.status not in [
            SyncStatus.PENDING.value,
            SyncStatus.PAUSED.value,
            SyncStatus.RETRY.value,
        ]:
            return False
        return True

    def get(self, task_id: int) -> Optional[SyncTask]:
        return self.db.query(SyncTask).filter(SyncTask.id == task_id).first()

    def update(self, task_id: int, **kwargs) -> Optional[SyncTask]:
        sync_task = self.get(task_id)
        if not sync_task:
            return None
        column_names = sync_task.__table__.columns.keys()
        for k, v in kwargs.items():
            if k in column_names:
                setattr(sync_task, k, v)
        self.db.commit()
        self.db.refresh(sync_task)
        return sync_task

    def delete(self, task_id: int) -> bool:
        sync_task = self.get(task_id)
        if not sync_task:
            return False
        self.db.delete(sync_task)
        self.db.commit()
        return True

    def list(
        self,
        user_id: int = None,
        type: str = None,
        status: str = None,
        limit: int = 100,
        offset: int = 0,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        updated_after: Optional[datetime] = None,
        updated_before: Optional[datetime] = None,
        has_failed_records: Optional[bool] = None,
        min_total_records: Optional[int] = None,
        max_total_records: Optional[int] = None,
    ) -> List[SyncTask]:
        query = self.db.query(SyncTask)

        # Basic filters
        if user_id is not None:
            query = query.filter(SyncTask.user_id == user_id)
        if type is not None:
            query = query.filter(SyncTask.type == type)
        if status is not None:
            query = query.filter(SyncTask.status == status)

        # Date filters
        if created_after is not None:
            query = query.filter(SyncTask.created_at >= created_after)
        if created_before is not None:
            query = query.filter(SyncTask.created_at <= created_before)
        if updated_after is not None:
            query = query.filter(SyncTask.updated_at >= updated_after)
        if updated_before is not None:
            query = query.filter(SyncTask.updated_at <= updated_before)

        # Record count filters
        if has_failed_records is not None:
            if has_failed_records:
                query = query.filter(SyncTask.failed_records > 0)
            else:
                query = query.filter(SyncTask.failed_records == 0)
        if min_total_records is not None:
            query = query.filter(SyncTask.total_records >= min_total_records)
        if max_total_records is not None:
            query = query.filter(SyncTask.total_records <= max_total_records)

        # Sorting
        sort_column = getattr(SyncTask, sort_by, SyncTask.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # Pagination
        query = query.offset(offset).limit(limit)

        return query.all()
