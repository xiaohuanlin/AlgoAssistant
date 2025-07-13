"""
Task manager for starting Celery tasks based on sync task type.
Uses object-oriented design and reuses existing service components.
"""

from app.models import SyncTask, SyncTaskType
from app.tasks.github_sync import github_sync_task
from app.tasks.leetcode_batch_sync import leetcode_batch_sync_task
from app.tasks.leetcode_detail_sync import leetcode_detail_sync_task
from app.utils.logger import get_logger

logger = get_logger("task_manager")


class TaskManager:
    def start_sync_task(self, task: SyncTask) -> bool:
        if task.type == SyncTaskType.GITHUB_SYNC.value:
            return github_sync_task.apply_async(args=[task.id], queue="git_sync_queue")
        elif task.type == SyncTaskType.LEETCODE_BATCH_SYNC.value:
            return leetcode_batch_sync_task.apply_async(
                args=[task.id], queue="leetcode_sync_queue"
            )
        elif task.type == SyncTaskType.LEETCODE_DETAIL_SYNC.value:
            return leetcode_detail_sync_task.apply_async(
                args=[task.id], queue="leetcode_sync_queue"
            )
        return False
