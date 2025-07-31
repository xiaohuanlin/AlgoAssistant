import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.deps import get_current_user, get_db
from app.schemas import (
    PasswordChange,
    PasswordChangeResponse,
    UserConfigCreate,
    UserConfigOut,
    UserCreate,
    UserLogin,
    UserLoginResponse,
    UserOut,
    UserUpdate,
)
from app.services.user_config_service import UserConfigService
from app.services.user_service import UserService
from app.tasks.review_notification import check_due_reviews
from app.utils import security

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/register", response_model=UserLoginResponse, status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    service = UserService(db)
    if service.get_user_by_username(user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if service.get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    db_user = service.create_user(user)

    # Generate access token for automatic login
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": db_user.username, "exp": expire}
    access_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

    return UserLoginResponse(
        access_token=access_token, token_type="bearer", user=db_user
    )


@router.post("/login", response_model=UserLoginResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    service = UserService(db)
    db_user = service.get_user_by_username(user.username)
    if not db_user or not security.verify_password(
        user.password, db_user.password_hash
    ):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": db_user.username, "exp": expire}
    access_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return UserLoginResponse(
        access_token=access_token, token_type="bearer", user=db_user
    )


@router.get("/me", response_model=UserOut)
def get_current_user_info(current_user=Depends(get_current_user)):
    return current_user


@router.get("/auth-type")
def get_user_auth_type(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Check if user is OAuth user or regular user."""
    service = UserService(db)
    db_user = service.get_user_by_username(current_user.username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if password is the OAuth placeholder
    is_oauth_user = db_user.password_hash and security.verify_password(
        "google_oauth_user", db_user.password_hash
    )

    return {
        "is_oauth_user": is_oauth_user,
        "auth_type": "oauth" if is_oauth_user else "regular",
        "has_password": not is_oauth_user,
    }


@router.get("/user/profile", response_model=UserOut)
def get_profile(current_user=Depends(get_current_user)):
    return current_user


@router.put("/user/profile", response_model=UserOut)
def update_profile(
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = UserService(db)
    db_user = service.get_user_by_username(current_user.username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update only provided fields using dict comprehension
    update_data = user.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = security.get_password_hash(
            update_data.pop("password")
        )

    for field, value in update_data.items():
        if hasattr(db_user, field):
            setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/change-password", response_model=PasswordChangeResponse)
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Change user password with current password verification."""
    service = UserService(db)
    db_user = service.get_user_by_username(current_user.username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if this is an OAuth user trying to set password for the first time
    if db_user.password_hash and security.verify_password(
        "google_oauth_user", db_user.password_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="OAuth users should use set-password endpoint instead",
        )

    # Verify current password
    if not security.verify_password(
        password_data.current_password, db_user.password_hash
    ):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Update password
    db_user.password_hash = security.get_password_hash(password_data.new_password)
    db_user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_user)

    return PasswordChangeResponse(
        message="Password changed successfully", updated_at=db_user.updated_at
    )


@router.post("/set-password", response_model=PasswordChangeResponse)
def set_password(
    password_data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Set password for OAuth users who don't have a password yet."""
    service = UserService(db)
    db_user = service.get_user_by_username(current_user.username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if this is an OAuth user (password is "google_oauth_user")
    if not (
        db_user.password_hash
        and security.verify_password("google_oauth_user", db_user.password_hash)
    ):
        raise HTTPException(
            status_code=400,
            detail="This endpoint is only for OAuth users without a password",
        )

    # Validate new password
    new_password = password_data.get("new_password")
    if not new_password:
        raise HTTPException(status_code=400, detail="New password is required")

    if len(new_password) < 6:
        raise HTTPException(
            status_code=400, detail="Password must be at least 6 characters long"
        )

    # Set new password
    db_user.password_hash = security.get_password_hash(new_password)
    db_user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_user)

    return PasswordChangeResponse(
        message="Password set successfully", updated_at=db_user.updated_at
    )


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload user avatar image."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Validate file size (2MB limit)
    file_size = 0
    content = await file.read()
    file_size = len(content)

    if file_size > 2 * 1024 * 1024:  # 2MB in bytes
        raise HTTPException(status_code=400, detail="File size must be less than 2MB")

    # Create upload directory if it doesn't exist
    upload_dir = "uploads/avatars"
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Update user avatar in database
    service = UserService(db)
    db_user = service.get_user_by_username(current_user.username)
    if db_user:
        # Store relative path for avatar URL
        avatar_url = f"/uploads/avatars/{unique_filename}"
        db_user.avatar = avatar_url
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)

    return JSONResponse(
        status_code=200,
        content={
            "message": "Avatar uploaded successfully",
            "url": avatar_url,
            "filename": unique_filename,
        },
    )


@router.post("/config", response_model=UserConfigOut)
def create_config(
    config: UserConfigCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = UserConfigService(db)
    return service.create(current_user.id, config)


@router.get("/config", response_model=UserConfigOut)
def get_config(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = UserConfigService(db)
    config = service.get(current_user.id)
    if not config:
        config = service.create(current_user.id, UserConfigCreate())
    return config


@router.put("/config", response_model=UserConfigOut)
def update_config(
    config: UserConfigCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = UserConfigService(db)
    updated = service.update(current_user.id, config)
    if not updated:
        raise HTTPException(status_code=404, detail="User config not found")
    return service.get(current_user.id)


@router.post("/trigger-notifications")
def trigger_notifications(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Manually trigger notification checking (for testing purposes)"""
    try:
        # Run the notification task directly
        check_due_reviews()
        return {
            "message": "Notification task completed successfully",
            "status": "success",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to run notification task: {str(e)}"
        )
