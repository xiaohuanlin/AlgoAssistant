import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db, get_redis_client
from app.schemas import LeetCodeConnectionTestOut
from app.services.leetcode_service import LeetCodeService
from app.services.user_config_service import UserConfigService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/leetcode", tags=["LeetCode"])


@router.get("/test-connection", response_model=LeetCodeConnectionTestOut)
def test_connection(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Test LeetCode connection with detailed diagnostics"""
    user_config_service = UserConfigService(db)
    user_config = user_config_service.get(current_user.id)
    leetcode_config = (
        user_config.leetcode_config
        if user_config and user_config.leetcode_config
        else None
    )
    if not leetcode_config:
        raise HTTPException(status_code=400, detail="LeetCode not connected")

    leetcode_service = LeetCodeService(leetcode_config)
    if leetcode_service.test_connection():
        return LeetCodeConnectionTestOut(
            status="success", message="LeetCode connected successfully"
        )
    else:
        raise HTTPException(status_code=400, detail="LeetCode connection failed")


@router.get("/profile")
def get_leetcode_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    redis_client=Depends(get_redis_client),
):
    """Get current user's LeetCode profile, with Redis cache (5min)"""
    cache_key = f"leetcode:profile:{current_user.id}"
    cached = redis_client.get(cache_key)
    if cached:
        try:
            return json.loads(cached)
        except Exception as e:
            logger.warning(f"Failed to decode cached leetcode profile: {e}")
    user_config_service = UserConfigService(db)
    config = user_config_service.get(current_user.id)
    if not config:
        raise HTTPException(status_code=400, detail="LeetCode not connected")
    leetcode_service = LeetCodeService(config.leetcode_config)
    profile = leetcode_service.get_user_profile()
    if not profile:
        raise HTTPException(status_code=400, detail="Failed to fetch LeetCode profile")
    result = {
        "username": profile.get("username"),
        "user_avatar": profile.get("user_avatar"),
        "total_ac_count": profile.get("total_ac_count"),
        "total_submissions": profile.get("total_submissions"),
        "ranking": profile.get("ranking"),
    }
    try:
        redis_client.setex(cache_key, 300, json.dumps(result))
    except Exception as e:
        logger.warning(f"Failed to cache leetcode profile: {e}")
    return result
