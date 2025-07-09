from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_user
from app.services.service_factory import ServiceFactory
from app.services.record_service import RecordService
from app.schemas import SyncLogOut
from typing import List

router = APIRouter(prefix="/api/leetcode", tags=["leetcode"])

# Placeholder for LeetCode integration endpoints
# Future: sync records, fetch problems, etc.

@router.post("/sync", response_model=SyncLogOut)
def sync_leetcode_records(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Example: get user_config from current_user or user_config table
    user_config = {"oj_type": "leetcode"}
    leetcode_username = current_user.configs.leetcode_name if current_user.configs else None
    if not leetcode_username:
        raise HTTPException(status_code=400, detail="LeetCode username not configured.")
    factory = ServiceFactory(user_config)
    oj_service = factory.oj_service
    record_service = RecordService(db)
    sync_log = record_service.sync_records_from_oj(current_user.id, oj_service, leetcode_username)
    return sync_log

@router.get("/sync/logs", response_model=List[SyncLogOut])
def list_sync_logs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    logs = db.query(SyncLogOut.__config__.orm_mode.model).filter_by(user_id=current_user.id, oj_type="leetcode").order_by(SyncLogOut.sync_time.desc()).all()
    return logs 