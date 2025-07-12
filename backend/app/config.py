import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/algo_assistant"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    FERNET_KEY: str = "your-32-byte-base64-encoded-fernet-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # GitHub OAuth
    GITHUB_CLIENT_ID: str = "your-github-client-id"
    GITHUB_CLIENT_SECRET: str = "your-github-client-secret"
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/api/github/callback"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = "your-google-client-id"
    GOOGLE_CLIENT_SECRET: str = "your-google-client-secret"
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/google/callback"
    
    # OpenAI
    OPENAI_API_KEY: str = "your-openai-api-key"
    
    # Notion
    NOTION_TOKEN: str = "your-notion-token"
    NOTION_DATABASE_ID: str = "your-notion-database-id"
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # LeetCode Sync Rate Limiting
    USER_RATE_LIMIT_DELAY: float = 2.0
    
    # LeetCode Sync Configuration
    MAX_SUBMISSIONS_PER_USER: int = 1000
    
    class Config:
        env_file = ".env"

settings = Settings() 