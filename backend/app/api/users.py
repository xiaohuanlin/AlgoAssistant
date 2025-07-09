from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas import UserCreate, UserLogin, UserOut, UserConfigCreate, UserConfigOut
from app.services.user_service import UserService
from app.deps import get_db, get_current_user
from app.utils import security
from jose import jwt
from datetime import timedelta, datetime
from app.config import settings

router = APIRouter(prefix="/api", tags=["users"])

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    service = UserService(db)
    if service.get_user_by_username(user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if service.get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return service.create_user(user)

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    service = UserService(db)
    db_user = service.get_user_by_username(user.username)
    if not db_user or not security.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": db_user.username, "exp": expire}
    access_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def get_current_user_info(current_user = Depends(get_current_user)):
    return current_user

@router.get("/user/profile", response_model=UserOut)
def get_profile(current_user = Depends(get_current_user)):
    return current_user

@router.put("/user/profile", response_model=UserOut)
def update_profile(user: UserCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    service = UserService(db)
    db_user = service.get_user_by_username(current_user.username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.nickname = user.nickname
    db_user.avatar = user.avatar
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/config", response_model=UserConfigOut)
def create_config(config: UserConfigCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    service = UserService(db)
    return service.create_user_config(current_user.id, config)

@router.get("/config", response_model=UserConfigOut)
def get_config(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    service = UserService(db)
    return service.get_user_config(current_user.id)

@router.put("/config", response_model=UserConfigOut)
def update_config(config: UserConfigCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    service = UserService(db)
    updated = service.update_user_config(current_user.id, config)
    if not updated:
        raise HTTPException(status_code=404, detail="Config not found")
    return service.get_user_config(current_user.id) 