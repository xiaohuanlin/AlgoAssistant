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

class UserConfigCreate(UserConfigBase):
    pass

class UserConfigOut(BaseModel):
    id: int
    user_id: int
    leetcode_name: Optional[str] = None
    github_repo: Optional[str] = None
    notion_db_id: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class RecordBase(BaseModel):
    oj_type: str
    problem_id: str
    problem_title: str
    status: str
    language: str
    code: str
    submit_time: Optional[datetime] = None

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
    id: int
    ai_analysis: Optional[Dict[str, Any]] = None
    analyzed: bool = False
    tags: List[TagOut] = []
    notion_url: Optional[str] = None
    github_pushed: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

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