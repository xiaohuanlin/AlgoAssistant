from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import User
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats/basic", response_model=Dict[str, Any])
async def get_basic_stats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get basic dashboard statistics including total problems, solved count, streak days, etc.

    Returns:
        Dict containing basic statistics for the current user
    """
    try:
        service = DashboardService(db)
        return service.get_basic_stats(current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get basic stats: {str(e)}"
        )


@router.get("/stats/categories", response_model=List[Dict[str, Any]])
async def get_category_stats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get algorithm category statistics based on topic tags and AI analysis.

    Returns:
        List of category statistics with completion rates and error rates
    """
    try:
        service = DashboardService(db)
        return service.get_category_stats(current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get category stats: {str(e)}"
        )


@router.get("/activity/recent", response_model=List[Dict[str, Any]])
async def get_recent_activity(
    limit: int = Query(
        default=10,
        ge=1,
        le=50,
        description="Maximum number of recent activities to return",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Get recent submission activity.

    Args:
        limit: Maximum number of records to return (1-50)

    Returns:
        List of recent submission records with problem details
    """
    try:
        service = DashboardService(db)
        return service.get_recent_activity(current_user.id, limit)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get recent activity: {str(e)}"
        )


@router.get("/errors/analysis", response_model=Dict[str, Any])
async def get_error_analysis(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get error analysis and review statistics.

    Returns:
        Dict containing recent errors and review information
    """
    try:
        service = DashboardService(db)
        return service.get_error_analysis(current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get error analysis: {str(e)}"
        )


@router.get("/progress/trend", response_model=List[Dict[str, Any]])
async def get_progress_trend(
    days: int = Query(
        default=30,
        ge=7,
        le=365,
        description="Number of days to include in trend analysis",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Get progress trend data for the specified number of days.

    Args:
        days: Number of days to include in trend (7-365)

    Returns:
        List of daily progress data with submission counts
    """
    try:
        service = DashboardService(db)
        return service.get_progress_trend(current_user.id, days)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get progress trend: {str(e)}"
        )


@router.get("/overview", response_model=Dict[str, Any])
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get complete dashboard overview including all statistics and recent data.

    Returns:
        Dict containing comprehensive dashboard data
    """
    try:
        service = DashboardService(db)

        # Get all dashboard data in parallel
        basic_stats = service.get_basic_stats(current_user.id)
        category_stats = service.get_category_stats(current_user.id)
        recent_activity = service.get_recent_activity(current_user.id, 10)
        error_analysis = service.get_error_analysis(current_user.id)
        progress_trend = service.get_progress_trend(current_user.id, 30)

        return {
            "basicStats": basic_stats,
            "categoryStats": category_stats,
            "recentActivity": recent_activity,
            "errorAnalysis": error_analysis,
            "progressTrend": progress_trend,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get dashboard overview: {str(e)}"
        )
