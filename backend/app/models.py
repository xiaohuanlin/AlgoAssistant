from datetime import datetime, timedelta
from enum import Enum

from sqlalchemy import (
    JSON,
    BigInteger,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship

from app.schemas.record import LanguageType, OJType, SyncStatus, SyncTaskType

from .database import Base
from .schemas.gemini import GeminiConfig
from .schemas.github import GitHubConfig
from .schemas.google import GoogleConfig
from .schemas.leetcode import LeetCodeConfig
from .schemas.notion import NotionConfig
from .types import PydanticJSON


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(32), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    nickname = Column(String(64), nullable=True)
    avatar = Column(String(256), nullable=True)
    sync_allowed = Column(
        String(8), default="true"
    )  # "true" or "false" - control sync permission
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    configs = relationship(
        "UserConfig",
        back_populates="user",
        uselist=False,
        cascade="none",
        passive_updates=True,
    )


class UserConfig(Base):
    __tablename__ = "user_configs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    google_config = Column(PydanticJSON(GoogleConfig), nullable=True)
    github_config = Column(PydanticJSON(GitHubConfig), nullable=True)
    leetcode_config = Column(PydanticJSON(LeetCodeConfig), nullable=True)
    notion_config = Column(PydanticJSON(NotionConfig), nullable=True)
    gemini_config = Column(PydanticJSON(GeminiConfig), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship(
        "User", back_populates="configs", cascade="none", passive_updates=True
    )


class LeetCodeProblem(Base):
    """Model for LeetCode problems."""

    __tablename__ = "leetcode_problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    title_slug = Column(String(255), nullable=False, unique=True, index=True)
    content = Column(Text, nullable=True)  # Problem description
    difficulty = Column(String(20), nullable=True)  # Easy, Medium, Hard
    topic_tags = Column(JSON, nullable=True)  # Array of topic tags
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Record(Base):
    """Model for problem solving records."""

    __tablename__ = "records"

    # Primary key and foreign keys
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    problem_id = Column(
        Integer, ForeignKey("leetcode_problems.id"), nullable=True
    )  # Reference to LeetCode problem

    # Basic submission information
    oj_type = Column(String(32), default=OJType.leetcode.value)
    execution_result = Column(String(32), nullable=False)  # e.g. Accepted,Wrong Answer"
    oj_sync_status = Column(String(32), default=SyncStatus.PENDING.value)
    github_sync_status = Column(String(32), default=SyncStatus.PENDING.value)
    ai_sync_status = Column(String(32), default=SyncStatus.PENDING.value)
    language = Column(String(32), default=LanguageType.python.value)
    code = Column(Text, nullable=True)
    submission_id = Column(Integer, nullable=False)
    submit_time = Column(DateTime, default=datetime.utcnow)
    submission_url = Column(String(512), nullable=True)  # LeetCode submission URL

    # Git sync specific fields
    git_file_path = Column(String(500), nullable=True)  # File path in Git repository

    # Performance metrics
    runtime = Column(String(32), nullable=True)  # e.g. "4 ms", "1.2 s"
    memory = Column(String(32), nullable=True)  # e.g. "14.2 MB", "45.6 KB"
    runtime_percentile = Column(Float, nullable=True)  # Runtime percentile
    memory_percentile = Column(Float, nullable=True)  # Memory percentile

    # Test case information
    total_correct = Column(Integer, nullable=True)
    total_testcases = Column(Integer, nullable=True)

    # Additional information
    topic_tags = Column(JSON, nullable=True)  # Array of topic tags
    ai_analysis = Column(JSON, nullable=True)  # Store AI result as JSON
    notion_url = Column(String(256), nullable=True)  # Notion page link after sync

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="records", cascade="none", passive_updates=True)
    problem = relationship(
        "LeetCodeProblem", backref="records", cascade="none", passive_updates=True
    )
    tags = relationship(
        "Tag",
        secondary="record_tag",
        backref="records",
        cascade="none",
        passive_updates=True,
    )


class SyncTask(Base):
    """Model for all synchronization tasks (Git, LeetCode, etc)."""

    __tablename__ = "sync_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default=SyncStatus.PENDING.value)
    total_records = Column(Integer, default=0)
    synced_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    record_ids = Column(
        JSON, nullable=True
    )  # List of submission_ids for this sync task
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paused_at = Column(DateTime, nullable=True)  # When task was paused
    resumed_at = Column(DateTime, nullable=True)  # When task was resumed
    record_ids = Column(
        JSON, nullable=True
    )  # List of submission_ids for this sync task
    type = Column(String(32), nullable=False, default=SyncTaskType.GITHUB_SYNC.value)

    # Relationships
    user = relationship(
        "User", backref="sync_tasks", cascade="none", passive_updates=True
    )


record_tag = Table(
    "record_tag",
    Base.metadata,
    Column("record_id", Integer, ForeignKey("records.id")),
    Column("tag_id", Integer, ForeignKey("tags.id")),
)


class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, nullable=False)
    wiki = Column(Text, nullable=True)
    notion_url = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    record_id = Column(Integer, ForeignKey("records.id"), nullable=False)
    wrong_reason = Column(Text, nullable=True)  # Why the problem was wrong
    review_plan = Column(Text, nullable=True)  # Review plan or notes
    next_review_date = Column(
        DateTime,
        default=lambda: datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        + timedelta(days=1),
    )  # Next review date based on memory curve
    review_count = Column(Integer, default=0)  # Number of times reviewed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", backref="reviews")
    record = relationship("Record", backref="reviews")
