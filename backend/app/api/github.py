from typing import Any, Dict

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from app import models
from app.deps import get_current_user, get_db
from app.schemas import GitHubConnectionTestOut, GitHubPushRequest, GitHubPushResponse
from app.services.github_service import GitHubService
from app.services.user_config_service import UserConfigService

router = APIRouter(prefix="/api/github", tags=["github"])


@router.get("/test_connection", response_model=GitHubConnectionTestOut)
def test_connection(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Test GitHub connection."""
    user_config_service = UserConfigService(db)
    github_config = user_config_service.get_github_config(current_user.id)
    if not github_config:
        raise HTTPException(status_code=400, detail="GitHub not connected")
    github_service = GitHubService(github_config)
    if github_service.test_connection():
        return GitHubConnectionTestOut(message="GitHub connected successfully")
    else:
        raise HTTPException(status_code=400, detail="GitHub connection failed")
