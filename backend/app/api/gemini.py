from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import User
from app.schemas.gemini import AIAnalysisStatsResponse, ConnectionTestResponse
from app.services.gemini_service import GeminiService
from app.services.record_service import RecordService
from app.services.user_config_service import UserConfigService

router = APIRouter(prefix="/api/gemini", tags=["AI Analysis"])


@router.get("/profile", response_model=AIAnalysisStatsResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get AI analysis statistics for the current user, including:
    - Total records count
    - Analyzed records count
    - Pending analysis records count
    - Failed analysis records count
    - Analysis coverage rate
    """
    try:
        record_service = RecordService(db)
        stats = record_service.get_analysis_stats(user_id=current_user.id)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analysis stats: {str(e)}",
        )


@router.post("/test-connection", response_model=ConnectionTestResponse)
async def test_connection(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Test if Gemini API connection is working properly
    - Validate API key
    - Check if API service is available
    - Return connection status and related information
    """
    try:
        user_config_service = UserConfigService(db)
        user_config = user_config_service.get(current_user.id)
        gemini_config = (
            user_config.gemini_config
            if user_config and user_config.gemini_config
            else None
        )
        if not gemini_config:
            raise HTTPException(status_code=400, detail="Gemini not connected")

        ai_service = GeminiService(gemini_config)
        is_connected = ai_service.test_connection()

        return ConnectionTestResponse(
            status="success" if is_connected else "failed",
            message=(
                "Successfully connected to Gemini API"
                if is_connected
                else "Failed to connect to Gemini API"
            ),
            model=gemini_config.model_name,
        )
    except ValueError as e:
        return ConnectionTestResponse(
            status="failed",
            message=str(e),
            model=None,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Connection test failed: {str(e)}",
        )
