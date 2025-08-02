import random
import time
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.deps import get_current_user, get_db
from app.models import Tag
from app.schemas import (
    RecordCreate,
    RecordDeleteResponse,
    RecordDetailOut,
    RecordListOut,
    RecordListResponse,
    RecordManualCreate,
    RecordStatsOut,
    RecordUpdate,
    TagAssignRequest,
    TagOut,
    TagWikiUpdateRequest,
)
from app.schemas.record import SyncStatus
from app.services.record_service import RecordService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/records", tags=["records"])


class RecordQueryBuilder:
    """Helper class to build record queries with filters."""

    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.base_query = db.query(models.Record).filter(
            models.Record.user_id == user_id
        )

    def apply_filters(self, **filters) -> "RecordQueryBuilder":
        """Apply all filters to the query."""
        filter_methods = {
            "tag": self._apply_single_tag_filter,
            "tags": self._apply_multiple_tags_filter,
            "github_sync_status": lambda v: self._apply_list_filter(
                "github_sync_status", v
            ),
            "oj_sync_status": lambda v: self._apply_list_filter("oj_sync_status", v),
            "ai_sync_status": lambda v: self._apply_list_filter("ai_sync_status", v),
            "status": lambda v: self._apply_list_filter("execution_result", v),
            "oj_type": lambda v: self._apply_single_filter("oj_type", v),
            "language": lambda v: self._apply_single_filter("language", v),
            "problem_title": self._apply_problem_title_filter,
            "problem_id": lambda v: self._apply_single_filter("problem_id", v),
            "start_time": lambda v: self._apply_time_filter(">=", v),
            "end_time": lambda v: self._apply_time_filter("<=", v),
        }

        for key, value in filters.items():
            if value and key in filter_methods:
                filter_methods[key](value)

        return self

    def _apply_single_tag_filter(self, tag: str):
        self.base_query = self.base_query.join(models.Record.tags).filter(
            models.Tag.name == tag
        )

    def _apply_multiple_tags_filter(self, tags: str):
        tag_names = [t.strip() for t in tags.split(",") if t.strip()]
        self.base_query = self.base_query.join(models.Record.tags).filter(
            models.Tag.name.in_(tag_names)
        )

    def _apply_list_filter(self, field: str, values: list):
        self.base_query = self.base_query.filter(
            getattr(models.Record, field).in_(values)
        )

    def _apply_single_filter(self, field: str, value):
        self.base_query = self.base_query.filter(getattr(models.Record, field) == value)

    def _apply_problem_title_filter(self, title: str):
        self.base_query = self.base_query.join(models.Problem).filter(
            models.Problem.title.ilike(f"%{title}%")
        )

    def _apply_time_filter(self, operator: str, time_str: str):
        try:
            time_formatted = time_str.replace("Z", "+00:00")
            dt = datetime.fromisoformat(time_formatted)
            if operator == ">=":
                self.base_query = self.base_query.filter(
                    models.Record.submit_time >= dt
                )
            elif operator == "<=":
                self.base_query = self.base_query.filter(
                    models.Record.submit_time <= dt
                )
        except ValueError:
            logger.warning(f"Invalid time format: {time_str}")

    def get_query(self):
        return self.base_query


@router.post("/", response_model=RecordDetailOut)
def create_record(
    record: RecordManualCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new problem record. Only allowed fields can be set by user, sync-related fields are auto-generated."""
    user_fields = record.model_dump()
    user_fields["oj_sync_status"] = SyncStatus.COMPLETED
    user_fields["github_sync_status"] = SyncStatus.PENDING
    user_fields["ai_sync_status"] = SyncStatus.PENDING
    user_fields["notion_sync_status"] = SyncStatus.PENDING
    user_fields["submission_id"] = int(f"{int(time.time())}")
    user_fields["submission_url"] = f"/manual/{user_fields['submission_id']}"
    user_fields["notion_url"] = None
    user_fields["notion_page_id"] = None
    user_fields["git_file_path"] = None
    user_fields["ai_analysis"] = None
    service = RecordService(db)
    db_record = service.create_record(current_user.id, RecordCreate(**user_fields))
    return service.to_record_detail_out(db_record)


@router.get("/", response_model=RecordListResponse)
def list_records(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tag: Optional[str] = Query(None, description="Filter by single tag"),
    tags: Optional[str] = Query(
        None, description="Filter by multiple tags (comma-separated)"
    ),
    status: Optional[List[str]] = Query(
        None, description="Filter by execution status (multi-param supported)"
    ),
    oj_type: Optional[str] = Query(None, description="Filter by OJ type"),
    oj_sync_status: Optional[List[str]] = Query(
        None, description="Filter by OJ synchronization status (multi-param supported)"
    ),
    github_sync_status: Optional[List[str]] = Query(
        None,
        description="Filter by GitHub synchronization status (multi-param supported)",
    ),
    ai_sync_status: Optional[List[str]] = Query(
        None, description="Filter by AI analysis status (multi-param supported)"
    ),
    language: Optional[str] = Query(None, description="Filter by programming language"),
    problem_title: Optional[str] = Query(
        None, description="Filter by problem title (partial match)"
    ),
    problem_id: Optional[int] = Query(None, description="Filter by problem ID"),
    start_time: Optional[str] = Query(
        None, description="Filter by submit time after (ISO format)"
    ),
    end_time: Optional[str] = Query(
        None, description="Filter by submit time before (ISO format)"
    ),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    sort_by: str = Query("submit_time", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
):
    """List problem records with filtering and pagination."""
    service = RecordService(db)

    # Build query with filters
    query_builder = RecordQueryBuilder(db, current_user.id)
    query_builder.apply_filters(
        tag=tag,
        tags=tags,
        status=status,
        oj_type=oj_type,
        oj_sync_status=oj_sync_status,
        github_sync_status=github_sync_status,
        ai_sync_status=ai_sync_status,
        language=language,
        problem_title=problem_title,
        problem_id=problem_id,
        start_time=start_time,
        end_time=end_time,
    )

    base_query = query_builder.get_query()
    total_records = base_query.count()

    # Apply sorting
    valid_sort_fields = [
        "submit_time",
        "created_at",
        "updated_at",
        "problem_title",
        "execution_result",
    ]
    if sort_by not in valid_sort_fields:
        sort_by = "submit_time"

    sort_column = getattr(models.Record, sort_by)
    if sort_order.lower() == "asc":
        base_query = base_query.order_by(sort_column.asc().nullslast())
    else:
        base_query = base_query.order_by(sort_column.desc().nullslast())

    # Apply pagination and get results
    records = base_query.offset(offset).limit(limit).all()

    page = (offset // limit) + 1
    total_pages = (total_records + limit - 1) // limit

    return RecordListResponse(
        items=[service.to_record_list_out(r) for r in records],
        total=total_records,
        page=page,
        page_size=limit,
        total_pages=total_pages,
    )


@router.get("/stats", response_model=RecordStatsOut)
def get_records_stats(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get statistics for user's records."""
    # Total records
    total = (
        db.query(func.count(models.Record.id))
        .filter(models.Record.user_id == current_user.id)
        .scalar()
    )

    # Solved records (Accepted status)
    solved = (
        db.query(func.count(models.Record.id))
        .filter(
            models.Record.user_id == current_user.id,
            models.Record.execution_result == "Accepted",
        )
        .scalar()
    )

    # Success rate
    success_rate = (solved / total * 100) if total > 0 else 0

    # Unique languages used
    languages = (
        db.query(func.count(func.distinct(models.Record.language)))
        .filter(models.Record.user_id == current_user.id)
        .scalar()
    )

    # Unique problems (deduplicate by problem_id)
    unique_problems = (
        db.query(func.count(func.distinct(models.Record.problem_id)))
        .filter(models.Record.user_id == current_user.id)
        .scalar()
    )

    return RecordStatsOut(
        total=total,
        solved=solved,
        successRate=round(success_rate, 1),
        languages=languages,
        unique_problems=unique_problems,
    )


@router.get("/{id}", response_model=RecordDetailOut)
def get_record(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific problem record by ID."""
    service = RecordService(db)
    db_record = service.get_record(id)
    if (
        not db_record
        or db_record.user_id != current_user.id
        or db_record.oj_sync_status != SyncStatus.COMPLETED.value
    ):
        raise HTTPException(status_code=404, detail="Record not found")
    return service.to_record_detail_out(db_record)


@router.put("/{id}", response_model=RecordDetailOut)
def update_record(
    id: int,
    record: RecordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update a problem record."""
    service = RecordService(db)
    db_record = service.get_record(id)
    if not db_record or db_record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Record not found")

    # Update fields using dict comprehension and setattr
    update_data = record.dict(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(db_record, field):
            setattr(db_record, field, value)

    db.commit()
    db.refresh(db_record)
    return service.to_record_detail_out(db_record)


@router.delete("/{id}", response_model=RecordDeleteResponse)
def delete_record(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete a problem record."""
    service = RecordService(db)
    db_record = service.get_record(id)
    if not db_record or db_record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Record not found")

    db.delete(db_record)
    db.commit()
    return RecordDeleteResponse(message="Record deleted successfully")


@router.get("/tags", response_model=List[TagOut])
def list_tags(db: Session = Depends(get_db)):
    """Get all available tags."""
    service = RecordService(db)
    tags = service.get_tags()
    return [TagOut.model_validate(tag) for tag in tags]


@router.post("/{id}/tags", response_model=RecordDetailOut)
def assign_tags(
    id: int,
    tag_request: TagAssignRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Assign tags to a record."""
    service = RecordService(db)
    db_record = service.get_record(id)
    if not db_record or db_record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Record not found")

    updated_record = service.assign_tags_to_record(db_record, tag_request.tag_names)
    return service.to_record_detail_out(updated_record)


@router.put("/tags/{tag_id}/wiki", response_model=TagOut)
def update_tag_wiki(
    tag_id: int, wiki_request: TagWikiUpdateRequest, db: Session = Depends(get_db)
):
    """Update tag wiki information."""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    tag.wiki = wiki_request.wiki
    db.commit()
    db.refresh(tag)
    return TagOut.model_validate(tag)
