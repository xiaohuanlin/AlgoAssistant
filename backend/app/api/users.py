from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.deps import get_current_user, get_db
from app.schemas import (
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
    return UserLoginResponse(access_token=access_token, token_type="bearer")


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
        db_user.password_hash = security.hash_password(user.password)

    db.commit()
    db.refresh(db_user)
    return db_user


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
        raise HTTPException(status_code=404, detail="User config not found")
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
        # If config doesn't exist, create new config
        return service.create(current_user.id, config)
    return service.get(current_user.id)
