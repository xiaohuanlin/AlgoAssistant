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
from app.utils import security

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    service = UserService(db)
    if service.get_user_by_username(user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if service.get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return service.create_user(user)


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

    # Update only provided fields
    if user.nickname is not None:
        db_user.nickname = user.nickname
    if user.avatar is not None:
        db_user.avatar = user.avatar
    if user.email is not None:
        db_user.email = user.email
    if user.username is not None:
        db_user.username = user.username
    if user.password is not None:
        db_user.password_hash = security.get_password_hash(user.password)

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
