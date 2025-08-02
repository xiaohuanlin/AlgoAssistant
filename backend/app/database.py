from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

from .config import settings

# Configure engine based on database type
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite configuration with optimization parameters
    # Note: SQLite with StaticPool doesn't support pool_size/max_overflow parameters
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={
            "check_same_thread": False,
            "timeout": settings.SQLITE_TIMEOUT / 1000,  # Convert ms to seconds
        },
        poolclass=StaticPool,
        pool_pre_ping=True,
        echo=settings.DATABASE_ECHO,
    )
else:
    # PostgreSQL or other database configuration
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=settings.SQLITE_POOL_SIZE,  # Reuse setting for consistency
        max_overflow=settings.SQLITE_MAX_OVERFLOW,  # Reuse setting for consistency
        pool_pre_ping=True,
        echo=settings.DATABASE_ECHO,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
