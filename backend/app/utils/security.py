import base64
from datetime import datetime, timedelta
from typing import Optional

import jwt
from cryptography.fernet import Fernet, InvalidToken
from passlib.context import CryptContext

from app.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hash the password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise jwt.ExpiredSignatureError("Token has expired")
    except jwt.JWTError as e:
        raise jwt.InvalidTokenError(f"Invalid token: {e}")


def get_current_user(token: str, db):
    """Get current user from token."""
    from app.models import User

    payload = verify_token(token)
    username: str = payload.get("sub")
    if username is None:
        raise jwt.InvalidTokenError("Could not validate credentials")

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise Exception("User not found")
    return user


def get_current_active_user(token: str, db):
    """Get current active user from token."""
    user = get_current_user(token, db)
    if not user.is_active:
        raise Exception("Inactive user")
    return user


def get_fernet() -> Fernet:
    """Get Fernet instance for encryption/decryption using FERNET_KEY from settings."""
    key = settings.FERNET_KEY.encode()
    # Fernet key must be 32 url-safe base64-encoded bytes
    if len(key) != 44:
        key = base64.urlsafe_b64encode(key.ljust(32, b"0"))
    return Fernet(key)


def encrypt_data(data: str) -> str:
    """Encrypt sensitive data using Fernet."""
    f = get_fernet()
    return f.encrypt(data.encode()).decode()


def decrypt_data(token: str) -> str:
    """Decrypt sensitive data using Fernet."""
    f = get_fernet()
    try:
        return f.decrypt(token.encode()).decode()
    except InvalidToken:
        return ""
