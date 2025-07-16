from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.services.review_service import ReviewService

router = APIRouter(prefix="/api/review", tags=["review"])
