from sqlalchemy import Column, Integer, BigInteger, String, DateTime, ForeignKey, Text, JSON, Table, Float
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
    sync_allowed = Column(String(8), default="true")  # "true" or "false" - control sync permission
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    configs = relationship('UserConfig', back_populates='user', uselist=False)

class UserConfig(Base):
    __tablename__ = 'user_configs'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    leetcode_name = Column(String(64), nullable=True)
    leetcode_session_cookie = Column(Text, nullable=True)  # LeetCode session cookie for crawling
    leetcode_csrf_token = Column(Text, nullable=True)  # LeetCode CSRF token for crawling
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
    
    # Primary key and foreign keys
    submission_id = Column(BigInteger, primary_key=True, index=True, unique=True, nullable=False)  # LeetCode submission ID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Basic submission information
    oj_type = Column(String(32), default="leetcode")
    problem_title = Column(String(256), nullable=False)
    status = Column(String(32), nullable=False)  # e.g. "Accepted", "Wrong Answer" - submission status
    sync_status = Column(String(32), default="pending")  # e.g. "pending", "syncing", "synced", "failed" - sync status
    language = Column(String(32), nullable=False)
    code = Column(Text, nullable=False)
    submit_time = Column(DateTime, default=datetime.utcnow)
    submission_url = Column(String(512), nullable=True)  # LeetCode submission URL
    
    # Performance metrics
    runtime = Column(String(32), nullable=True)  # e.g. "4 ms", "1.2 s"
    memory = Column(String(32), nullable=True)   # e.g. "14.2 MB", "45.6 KB"
    runtime_percentile = Column(Float, nullable=True)  # Runtime percentile
    memory_percentile = Column(Float, nullable=True)   # Memory percentile
    
    # Test case information
    total_correct = Column(Integer, nullable=True)  # Number of correct test cases
    total_testcases = Column(Integer, nullable=True)  # Total number of test cases
    success_rate = Column(Float, nullable=True)  # Success rate percentage
    
    # Error and output information
    runtime_error = Column(Text, nullable=True)  # Runtime error message
    compile_error = Column(Text, nullable=True)  # Compilation error message
    code_output = Column(Text, nullable=True)  # Code output
    expected_output = Column(Text, nullable=True)  # Expected output
    
    # Additional information
    topic_tags = Column(JSON, nullable=True)  # Array of topic tags
    ai_analysis = Column(JSON, nullable=True)  # Store AI result as JSON
    notion_url = Column(String(256), nullable=True)  # Notion page link after sync
    github_pushed = Column(DateTime, nullable=True)  # GitHub push timestamp
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="records")
    tags = relationship("Tag", secondary="record_tag", backref="records")

class SyncLog(Base):
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
    Column("record_id", BigInteger, ForeignKey("records.submission_id")),
    Column("tag_id", Integer, ForeignKey("tags.id"))
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
    record_id = Column(BigInteger, ForeignKey("records.submission_id"), nullable=False)
    wrong_reason = Column(Text, nullable=True)  # Why the problem was wrong
    review_plan = Column(Text, nullable=True)   # Review plan or notes
    next_review_date = Column(DateTime, default=lambda: datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1))  # Next review date based on memory curve
    review_count = Column(Integer, default=0)   # Number of times reviewed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", backref="reviews")
    record = relationship("Record", backref="reviews") 