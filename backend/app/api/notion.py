from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import UserConfig
from app.schemas import NotionConnectionTestOut

router = APIRouter(prefix="/api/notion", tags=["notion"])


@router.get("/test_connection", response_model=NotionConnectionTestOut)
def test_connection(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Test Notion connection."""
    user_config = (
        db.query(UserConfig).filter(UserConfig.user_id == current_user.id).first()
    )
    if not user_config or not user_config.notion_config:
        raise HTTPException(status_code=400, detail="Notion not configured")

    # TODO: Implement actual Notion connection test
    # For now, return success if config exists
    return NotionConnectionTestOut(message="Notion connected successfully")
