import os
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import ConfigDict, field_validator
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    # ================================
    # DATABASE CONFIGURATION
    # ================================
    DATABASE_URL: str = (
        "postgresql://postgres:postgres@localhost:5432/algo_assistant"  # pragma: allowlist secret
    )
    DATABASE_ECHO: bool = False

    # SQLite optimization settings
    SQLITE_TIMEOUT: int = 30000
    SQLITE_POOL_SIZE: int = 5
    SQLITE_MAX_OVERFLOW: int = 10

    # ================================
    # SECURITY CONFIGURATION
    # ================================
    SECRET_KEY: str = "your-secret-key-change-in-production"
    FERNET_KEY: str = "your-32-byte-base64-encoded-fernet-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    PASSWORD_HASH_ALGORITHM: str = "bcrypt"

    # ================================
    # APPLICATION SETTINGS
    # ================================
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"  # nosec B104
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Handle string representation of list from env file
            import ast

            try:
                return ast.literal_eval(v)
            except (ValueError, SyntaxError):
                return [origin.strip() for origin in v.split(",")]
        return v

    # ================================
    # REDIS CONFIGURATION
    # ================================
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # ================================
    # EXTERNAL SERVICE INTEGRATIONS
    # ================================

    # Google OAuth (only service used in mini deployment)
    GOOGLE_CLIENT_ID: str = "your-google-client-id"
    GOOGLE_CLIENT_SECRET: str = "your-google-client-secret"
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/google/callback"

    # ================================
    # FILE UPLOAD CONFIGURATION
    # ================================
    UPLOAD_DIR: str = "/app/data/uploads"
    MAX_FILE_SIZE: int = 5242880  # 5MB
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "gif", "pdf", "txt", "md"]

    @field_validator("ALLOWED_EXTENSIONS", mode="before")
    def parse_allowed_extensions(cls, v):
        if isinstance(v, str):
            import ast

            try:
                return ast.literal_eval(v)
            except (ValueError, SyntaxError):
                return [ext.strip() for ext in v.split(",")]
        return v

    # ================================
    # RATE LIMITING
    # ================================
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10

    # ================================
    # DEVELOPMENT SETTINGS
    # ================================
    DEBUG: bool = False
    RELOAD: bool = False
    ENABLE_PROFILING: bool = False

    # ================================
    # BACKGROUND TASK PROCESSING
    # ================================
    CELERY_WORKER_CONCURRENCY: int = 1

    # ================================
    # MEMORY OPTIMIZATION SETTINGS
    # ================================
    PYTHONOPTIMIZE: int = 1
    PYTHONDONTWRITEBYTECODE: int = 1
    PYTHONHASHSEED: str = "random"
    PYTHONUNBUFFERED: int = 1
    UVICORN_WORKERS: int = 1
    WEB_CONCURRENCY: int = 1

    model_config = ConfigDict()


settings = Settings()