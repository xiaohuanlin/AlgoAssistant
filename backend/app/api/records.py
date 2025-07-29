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


@router.post("/", response_model=RecordDetailOut)
def create_record(
    record: RecordManualCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new problem record. Only allowed fields can be set by user, sync-related fields are auto-generated."""
    user_fields = record.dict()
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
    base_query = db.query(models.Record).filter(
        models.Record.user_id == current_user.id
    )

    # Tag filtering
    if tag:
        base_query = base_query.join(models.Record.tags).filter(models.Tag.name == tag)
    elif tags:
        tag_names = [t.strip() for t in tags.split(",") if t.strip()]
        base_query = base_query.join(models.Record.tags).filter(
            models.Tag.name.in_(tag_names)
        )

    # Status filtering
    if github_sync_status:
        base_query = base_query.filter(
            models.Record.github_sync_status.in_(github_sync_status)
        )
    if oj_sync_status:
        base_query = base_query.filter(models.Record.oj_sync_status.in_(oj_sync_status))
    if ai_sync_status:
        base_query = base_query.filter(models.Record.ai_sync_status.in_(ai_sync_status))
    if status:
        base_query = base_query.filter(models.Record.execution_result.in_(status))
    if oj_type:
        base_query = base_query.filter(models.Record.oj_type == oj_type)
    if language:
        base_query = base_query.filter(models.Record.language == language)
    if problem_title:
        base_query = base_query.join(models.Problem).filter(
            models.Problem.title.ilike(f"%{problem_title}%")
        )
    if problem_id:
        base_query = base_query.filter(models.Record.problem_id == problem_id)

    # Time filtering
    if start_time:
        try:
            # Handle Z suffix for UTC timezone (fromisoformat doesn't support Z)
            start_time_formatted = start_time.replace('Z', '+00:00')
            start_dt = datetime.fromisoformat(start_time_formatted)
            logger.info(f"Filtering with start_time: {start_time} -> {start_dt}")
            base_query = base_query.filter(models.Record.submit_time >= start_dt)
        except ValueError:
            logger.warning(f"Invalid start_time format: {start_time}")
    if end_time:
        try:
            # Handle Z suffix for UTC timezone (fromisoformat doesn't support Z)
            end_time_formatted = end_time.replace('Z', '+00:00')
            end_dt = datetime.fromisoformat(end_time_formatted)
            logger.info(f"Filtering with end_time: {end_time} -> {end_dt}")
            base_query = base_query.filter(models.Record.submit_time <= end_dt)
        except ValueError:
            logger.warning(f"Invalid end_time format: {end_time}")

    # Get total count before applying pagination
    total_records = base_query.count()
    
    # Debug: log some submit_time values from database
    if start_time or end_time:
        sample_records = db.query(models.Record.submit_time).filter(
            models.Record.user_id == current_user.id
        ).limit(5).all()
        logger.info(f"Sample submit_time values from DB: {[r.submit_time for r in sample_records]}")
        logger.info(f"Total records matching time filter: {total_records}")

    # Sorting
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

    # Pagination
    paginated_query = base_query.offset(offset).limit(limit)
    records = paginated_query.all()

    # Calculate pagination info
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
    for field, value in record.dict(exclude_unset=True).items():
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
