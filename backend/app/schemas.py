from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., max_length=32)
    email: EmailStr
    nickname: Optional[str] = None
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserConfigBase(BaseModel):
    leetcode_name: Optional[str] = None
    github_repo: Optional[str] = None
    github_token: Optional[str] = None  # Encrypted GitHub access token
    notion_token: Optional[str] = None  # Encrypted storage
    notion_db_id: Optional[str] = None
    openai_key: Optional[str] = None    # Encrypted storage

class UserConfigCreate(BaseModel):
    leetcode_name: Optional[str] = None
    leetcode_session_cookie: Optional[str] = None
    leetcode_csrf_token: Optional[str] = None
    github_repo: Optional[str] = None
    github_token: Optional[str] = None
    google_token: Optional[str] = None
    notion_token: Optional[str] = None
    notion_db_id: Optional[str] = None
    openai_key: Optional[str] = None

class UserConfigOut(BaseModel):
    id: int
    user_id: int
    leetcode_name: Optional[str] = None
    leetcode_session_cookie: Optional[str] = None
    leetcode_csrf_token: Optional[str] = None
    github_repo: Optional[str] = None
    github_token: Optional[str] = None
    google_token: Optional[str] = None
    notion_token: Optional[str] = None
    notion_db_id: Optional[str] = None
    openai_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RecordBase(BaseModel):
    # Basic submission information
    oj_type: str
    submission_id: int
    problem_title: str
    status: str
    sync_status: Optional[str] = "pending"
    language: str
    code: str
    submit_time: Optional[datetime] = None
    submission_url: Optional[str] = None
    
    # Performance metrics
    runtime: Optional[str] = None
    memory: Optional[str] = None
    runtime_percentile: Optional[float] = None
    memory_percentile: Optional[float] = None
    
    # Test case information
    total_correct: Optional[int] = None
    total_testcases: Optional[int] = None
    success_rate: Optional[float] = None
    
    # Error and output information
    runtime_error: Optional[str] = None
    compile_error: Optional[str] = None
    code_output: Optional[str] = None
    expected_output: Optional[str] = None
    
    # Additional information
    topic_tags: Optional[List[str]] = None

class RecordCreate(RecordBase):
    pass

class TagBase(BaseModel):
    name: str
    wiki: Optional[str] = None

class TagCreate(TagBase):
    pass

class TagOut(TagBase):
    id: int
    notion_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class RecordOut(RecordBase):
    user_id: int
    ai_analysis: Optional[Dict[str, Any]] = None
    analyzed: bool = False
    notion_url: Optional[str] = None
    github_pushed: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SyncLogBase(BaseModel):
    oj_type: str
    sync_time: datetime
    record_count: int
    record_ids: Optional[List[int]] = None
    summary: Optional[str] = None

class SyncLogOut(SyncLogBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ReviewBase(BaseModel):
    wrong_reason: Optional[str] = None
    review_plan: Optional[str] = None

class ReviewCreate(ReviewBase):
    record_id: int

class ReviewOut(ReviewBase):
    id: int
    record_id: int
    next_review_date: Optional[datetime] = None
    review_count: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class GoogleLoginRequest(BaseModel):
    access_token: str = Field(..., description="Google access token for authentication")

class GoogleLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any] 