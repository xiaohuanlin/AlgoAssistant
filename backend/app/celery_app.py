from celery import Celery

from app.config.settings import settings

celery_app = Celery(
    "algo_assistant", broker=settings.REDIS_URL, backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    enable_utc=True,
)

celery_app.autodiscover_tasks(["app.tasks"])
