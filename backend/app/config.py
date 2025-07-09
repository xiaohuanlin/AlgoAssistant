import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'sqlite:///./app.db')
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'changeme')
    ENCRYPT_KEY: str = os.getenv('ENCRYPT_KEY', 'changeme')
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', 60 * 24))

settings = Settings() 