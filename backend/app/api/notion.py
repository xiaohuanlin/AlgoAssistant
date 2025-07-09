from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_user
from app.services.service_factory import ServiceFactory
from app.services.record_service import RecordService

router = APIRouter(prefix="/api/notion", tags=["notion"])

# Placeholder for Notion integration endpoints
# Future: sync records, manage notion db, etc. 

@router.post("/sync/{record_id}")
def sync_record_to_notion(
    record_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Example: get user_config from current_user or user_config table
    user_config = {"note_type": "notion"}
    factory = ServiceFactory(user_config)
    notion_service = factory.note_service
    service = RecordService(db)
    db_record = service.get_record(current_user.id, record_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    notion_url = service.sync_record_to_notion(db_record, notion_service)
    return {"notion_url": notion_url}

@router.post("/sync/batch")
def batch_sync_records_to_notion(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_config = {"note_type": "notion"}
    factory = ServiceFactory(user_config)
    notion_service = factory.note_service
    service = RecordService(db)
    results = service.batch_sync_records_to_notion(current_user.id, notion_service)
    return results 

@router.post("/tags/sync")
def batch_sync_tags_to_notion(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_config = {"note_type": "notion"}
    factory = ServiceFactory(user_config)
    notion_service = factory.note_service
    service = RecordService(db)
    results = service.batch_sync_tags_to_notion(notion_service)
    return results 