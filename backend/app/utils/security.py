from passlib.context import CryptContext
from cryptography.fernet import Fernet, InvalidToken
from app.config import settings
import base64

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash the password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_fernet() -> Fernet:
    """Get Fernet instance for encryption/decryption using ENCRYPT_KEY from settings."""
    key = settings.ENCRYPT_KEY.encode()
    # Fernet key must be 32 url-safe base64-encoded bytes
    if len(key) != 44:
        key = base64.urlsafe_b64encode(key.ljust(32, b'0'))
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