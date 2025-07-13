import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.deps import get_current_user, get_db
from app.schemas import LeetCodeConfig, LeetCodeConnectionTestOut
from app.services.leetcode_service import LeetCodeService
from app.services.user_config_service import UserConfigService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/leetcode", tags=["leetcode"])


@router.get("/test-connection", response_model=LeetCodeConnectionTestOut)
def test_connection(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Test LeetCode connection with detailed diagnostics"""
    user_config_service = UserConfigService(db)
    leetcode_config = user_config_service.get_leetcode_config(current_user.id)
    if not leetcode_config:
        raise HTTPException(status_code=400, detail="LeetCode not connected")

    leetcode_service = LeetCodeService(leetcode_config)
    if leetcode_service.test_connection():
        return LeetCodeConnectionTestOut(
            status="success", message="LeetCode connected successfully"
        )
    else:
        raise HTTPException(status_code=400, detail="LeetCode connection failed")
