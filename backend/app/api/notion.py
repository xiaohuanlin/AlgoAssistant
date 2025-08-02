from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import UserConfig
from app.schemas.notion import NotionConnectionTestOut
from app.services.notion_service import NotionService

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

    try:
        notion_service = NotionService(user_config.notion_config)
        if notion_service.test_connection():
            return NotionConnectionTestOut(
                message="Notion connected successfully", connected=True
            )
        else:
            return NotionConnectionTestOut(
                message="Failed to connect to Notion. Please check your configuration.",
                connected=False,
            )
    except Exception as e:
        return NotionConnectionTestOut(
            message=f"Connection test failed: {str(e)}", connected=False
        )
