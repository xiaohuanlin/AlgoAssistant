from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_user
from app.services.google_oauth_service import GoogleOAuthService
from app.services.user_service import UserService
from app import models, schemas
from jose import jwt
from datetime import timedelta, datetime
from app.config import settings

router = APIRouter(prefix="/api/google", tags=["google"])

@router.get("/auth")
def get_google_auth_url(
    request: Request,
    current_user = Depends(get_current_user)
):
    """Generate Google OAuth authorization URL for frontend redirect."""
    oauth_service = GoogleOAuthService()
    state = str(current_user.id)  # Use user ID as state for security
    auth_url = oauth_service.get_authorization_url(state)
    return {"auth_url": auth_url}

@router.get("/callback")
def google_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback and return JSON response."""
    oauth_service = GoogleOAuthService()
    
    # Exchange code for token
    token_data = oauth_service.exchange_code_for_token(code)
    if not token_data:
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")
    
    user_info = token_data["user_info"]
    
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
    
    user_config.google_token = encrypted_token
    db.commit()
    
    # Return JSON response for React frontend
    return {
        "success": True,
        "provider": "google",
        "email": user_info.get("email"),
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
        "message": "Google connected successfully"
    }

@router.get("/status")
def get_google_status(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Check if Google is connected and return connection status."""
    user_config = db.query(models.UserConfig).filter(models.UserConfig.user_id == current_user.id).first()
    
    if not user_config or not user_config.google_token:
        return {
            "connected": False,
            "message": "Google not connected"
        }
    
    # Validate token
    oauth_service = GoogleOAuthService()
    try:
        access_token = oauth_service.decrypt_token(user_config.google_token)
        # You can add token validation here if needed
        return {
            "connected": True,
            "message": "Google connected successfully"
        }
    except Exception as e:
        return {
            "connected": False,
            "message": f"Error validating token: {str(e)}"
        }

@router.delete("/disconnect")
def disconnect_google(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Disconnect Google and clear stored token."""
    user_config = db.query(models.UserConfig).filter(models.UserConfig.user_id == current_user.id).first()
    
    if not user_config or not user_config.google_token:
        raise HTTPException(status_code=400, detail="Google not connected")
    
    # Clear Google token
    user_config.google_token = None
    db.commit()
    
    return {"message": "Google disconnected successfully"}

@router.post("/login", response_model=schemas.GoogleLoginResponse)
def google_login(
    request: schemas.GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """Login or register user with Google access token."""
    oauth_service = GoogleOAuthService()
    
    # Get user info from access token
    user_info = oauth_service.get_user_info_from_access_token(request.access_token)
    if not user_info:
        raise HTTPException(status_code=400, detail="Invalid access token")
    
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided in token")
    
    # Check if user exists
    user_service = UserService(db)
    user = user_service.get_user_by_email(email)
    
    if not user:
        # Create new user
        user_data = schemas.UserCreate(
            username=email.split('@')[0],  # Use email prefix as username
            email=email,
            nickname=user_info.get("name", email.split('@')[0]),
            password="google_oauth_user"  # Placeholder password
        )
        user = user_service.create_user(user_data)
    
    # Generate JWT token
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user.username, "exp": expire}
    access_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return schemas.GoogleLoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "nickname": user.nickname
        }
    ) 