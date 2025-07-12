from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_user
from app.services.service_factory import ServiceFactory
from app.services.record_service import RecordService
from app.models import UserConfig

router = APIRouter(prefix="/api/notion", tags=["notion"])

# Placeholder for Notion integration endpoints
# Future: sync records, manage notion db, etc. 

@router.post("/sync/{submission_id}")
def sync_to_notion(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Sync a single record to Notion."""
    service = RecordService(db)
    
    # Get the record
    db_record = service.get_record(current_user.id, submission_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    # Get user config for Notion token
    user_config = db.query(UserConfig).filter(UserConfig.user_id == current_user.id).first()
    if not user_config or not user_config.notion_token:
        raise HTTPException(status_code=400, detail="Notion not configured. Please complete setup first.")
    
    # Create service factory with user config
    config_dict = {
        "notion_token": user_config.notion_token,
        "notion_db_id": user_config.notion_db_id
    }
    factory = ServiceFactory(config_dict)
    notion_service = factory.notion_service
    
    try:
        notion_url = service.sync_record_to_notion(db_record, notion_service)
        return {"notion_url": notion_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync to Notion: {str(e)}")

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