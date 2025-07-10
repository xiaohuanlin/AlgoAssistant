from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from .database import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(32), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    nickname = Column(String(64), nullable=True)
    avatar = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    configs = relationship('UserConfig', back_populates='user', uselist=False)

class UserConfig(Base):
    __tablename__ = 'user_configs'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    leetcode_name = Column(String(64), nullable=True)
    github_repo = Column(String(256), nullable=True)
    github_token = Column(String(512), nullable=True)  # Encrypted GitHub access token
    google_token = Column(String(512), nullable=True)  # Encrypted Google access token
    notion_token = Column(String(256), nullable=True)  # Encrypted storage
    notion_db_id = Column(String(128), nullable=True)
    openai_key = Column(String(256), nullable=True)    # Encrypted storage
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship('User', back_populates='configs')

class Record(Base):
    """Model for problem solving records."""
    __tablename__ = "records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    oj_type = Column(String(32), default="leetcode")
    problem_id = Column(String(64), nullable=False)
    problem_title = Column(String(256), nullable=False)
    status = Column(String(32), nullable=False)  # e.g. "Accepted", "Wrong Answer"
    language = Column(String(32), nullable=False)
    code = Column(Text, nullable=False)
    submit_time = Column(DateTime, default=datetime.utcnow)
    ai_analysis = Column(JSON, nullable=True)  # Store AI result as JSON
    notion_url = Column(String(256), nullable=True)  # Notion page link after sync
    github_pushed = Column(DateTime, nullable=True)  # GitHub push timestamp
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", backref="records")
    tags = relationship("Tag", secondary="record_tag", backref="records")

class SyncLog(Base):
    """Model for logging each OJ sync event."""
    __tablename__ = "sync_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    oj_type = Column(String(32), default="leetcode")
    sync_time = Column(DateTime, default=datetime.utcnow)
    record_count = Column(Integer, default=0)
    record_ids = Column(JSON, nullable=True)  # List of new record IDs or problem IDs
    summary = Column(String(512), nullable=True)  # Optional: brief summary or status
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", backref="sync_logs")

record_tag = Table(
    "record_tag",
    Base.metadata,
    Column("record_id", Integer, ForeignKey("records.id")),
    Column("tag_id", Integer, ForeignKey("tags.id"))
)

class Tag(Base):
    """Model for algorithm tags."""
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, nullable=False)
    wiki = Column(Text, nullable=True)
    notion_url = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Review(Base):
    """Model for tracking wrong problems and review plans."""
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    record_id = Column(Integer, ForeignKey("records.id"), nullable=False)
    wrong_reason = Column(Text, nullable=True)  # Why the problem was wrong
    review_plan = Column(Text, nullable=True)   # Review plan or notes
    next_review_date = Column(DateTime, default=lambda: datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1))  # Next review date based on memory curve
    review_count = Column(Integer, default=0)   # Number of times reviewed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", backref="reviews")
    record = relationship("Record", backref="reviews") 