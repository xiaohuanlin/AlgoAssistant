from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_user
from app.services.service_factory import ServiceFactory
from app.services.record_service import RecordService
from app.services.github_oauth_service import GitHubOAuthService
from app import models

router = APIRouter(prefix="/api/github", tags=["github"])

# Placeholder for GitHub integration endpoints
# Future: push code, repo config, etc. 

@router.post("/push/{record_id}")
def push_record_to_github(
    record_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Push a single record to GitHub using OAuth token."""
    # Get user config for GitHub token and repo
    user_config = db.query(models.UserConfig).filter(models.UserConfig.user_id == current_user.id).first()
    if not user_config or not user_config.github_token:
        raise HTTPException(status_code=400, detail="GitHub not configured. Please complete OAuth setup first.")
    
    # Create service factory with user config
    config_dict = {
        "repo_type": "github",
        "github_token": user_config.github_token,
        "github_repo": user_config.github_repo
    }
    factory = ServiceFactory(config_dict)
    github_service = factory.repo_service
    
    service = RecordService(db)
    db_record = service.get_record(current_user.id, record_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    repo_config = {"repo": user_config.github_repo}
    github_url = service.push_record_to_github(db_record, github_service, repo_config)
    return {"github_url": github_url}

@router.post("/push/batch")
def batch_push_records_to_github(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Batch push all unpushed records to GitHub using OAuth token."""
    # Get user config for GitHub token and repo
    user_config = db.query(models.UserConfig).filter(models.UserConfig.user_id == current_user.id).first()
    if not user_config or not user_config.github_token:
        raise HTTPException(status_code=400, detail="GitHub not configured. Please complete OAuth setup first.")
    
    # Create service factory with user config
    config_dict = {
        "repo_type": "github",
        "github_token": user_config.github_token,
        "github_repo": user_config.github_repo
    }
    factory = ServiceFactory(config_dict)
    github_service = factory.repo_service
    
    service = RecordService(db)
    repo_config = {"repo": user_config.github_repo}
    results = service.batch_push_records_to_github(current_user.id, github_service, repo_config)
    return results

@router.get("/auth")
def get_github_auth_url(
    request: Request,
    current_user = Depends(get_current_user)
):
    """Generate GitHub OAuth authorization URL for frontend redirect."""
    oauth_service = GitHubOAuthService()
    state = str(current_user.id)  # Use user ID as state for security
    auth_url = oauth_service.get_authorization_url(state)
    return {"auth_url": auth_url}

@router.get("/callback")
def github_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """Handle GitHub OAuth callback and return JSON response."""
    oauth_service = GitHubOAuthService()
    
    # Exchange code for token
    token_data = oauth_service.exchange_code_for_token(code)
    if not token_data:
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")
    
    # Get user info to verify token
    user_info = oauth_service.get_user_info(token_data["access_token"])
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get user info")
    
    # Get user from state (user_id)
    try:
        user_id = int(state)
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    # Store encrypted token in user config
    encrypted_token = oauth_service.encrypt_token(token_data["access_token"])
    
    # Get or create user config
    user_config = db.query(models.UserConfig).filter(models.UserConfig.user_id == user_id).first()
    if not user_config:
        user_config = models.UserConfig(user_id=user_id)
        db.add(user_config)
    
    user_config.github_token = encrypted_token
    user_config.github_repo = f"{user_info['login']}/leetcode-solutions"  # Default repo name
    db.commit()
    
    # Return JSON response for React frontend
    return {
        "success": True,
        "provider": "github",
        "username": user_info["login"],
        "repo": user_config.github_repo,
        "message": "GitHub connected successfully"
    }

@router.get("/status")
def get_github_status(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Check if GitHub is connected and return connection status."""
    user_config = db.query(models.UserConfig).filter(models.UserConfig.user_id == current_user.id).first()
    
    if not user_config or not user_config.github_token:
        return {
            "connected": False,
            "message": "GitHub not connected"
        }
    
    # Validate token
    oauth_service = GitHubOAuthService()
    try:
        access_token = oauth_service.decrypt_token(user_config.github_token)
        is_valid = oauth_service.validate_token(access_token)
        
        if is_valid:
            user_info = oauth_service.get_user_info(access_token)
            return {
                "connected": True,
                "username": user_info.get("login"),
                "repo": user_config.github_repo,
                "message": "GitHub connected successfully"
            }
        else:
            return {
                "connected": False,
                "message": "GitHub token expired"
            }
    except Exception as e:
        return {
            "connected": False,
            "message": f"Error validating token: {str(e)}"
        }

@router.delete("/disconnect")
def disconnect_github(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Disconnect GitHub and clear stored token."""
    user_config = db.query(models.UserConfig).filter(models.UserConfig.user_id == current_user.id).first()
    
    if not user_config or not user_config.github_token:
        raise HTTPException(status_code=400, detail="GitHub not connected")
    
    # Clear GitHub token and repo
    user_config.github_token = None
    user_config.github_repo = None
    db.commit()
    
    return {"message": "GitHub disconnected successfully"}

@router.put("/repo")
def update_github_repo(
    repo: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update GitHub repository name."""
    user_config = db.query(models.UserConfig).filter(models.UserConfig.user_id == current_user.id).first()
    
    if not user_config or not user_config.github_token:
        raise HTTPException(status_code=400, detail="GitHub not connected")
    
    # Validate repo format
    if "/" not in repo:
        raise HTTPException(status_code=400, detail="Invalid repository format. Expected 'owner/repo'")
    
    user_config.github_repo = repo
    db.commit()
    
    return {"message": "Repository updated successfully", "repo": repo} 