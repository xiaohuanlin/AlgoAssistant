import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/algo_assistant"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    FERNET_KEY: str = "your-32-byte-base64-encoded-fernet-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: str = "your-google-client-id"
    GOOGLE_CLIENT_SECRET: str = "your-google-client-secret"
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/google/callback"

    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"

    # LeetCode Sync Rate Limiting
    USER_RATE_LIMIT_DELAY: float = 2.0

    # LeetCode Sync Configuration
    MAX_SUBMISSIONS_PER_USER: int = 1000

    # Queue names
    LEETCODE_QUEUE_NAME: str = "leetcode_sync_queue"
    GIT_QUEUE_NAME: str = "git_sync_queue"

    # Consumer batch size
    CONSUMER_BATCH_SIZE: int = 5

    # DB connection timeout (seconds)
    DB_CONNECTION_TIMEOUT: int = 300

    # Rate limit configurations
    LEETCODE_RATE_LIMIT: dict = {
        "max_requests": 10,
        "window_seconds": 60,
        "operation": "leetcode_graphql",
    }
    GIT_RATE_LIMIT: dict = {
        "max_requests": 5,
        "window_seconds": 60,
        "operation": "github_api",
    }

    class Config:
        env_file = ".env"


settings = Settings()
