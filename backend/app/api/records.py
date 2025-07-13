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
    RecordOut,
    RecordStatsOut,
    TagAssignRequest,
    TagOut,
    TagWikiUpdateRequest,
)
from app.services.record_service import RecordService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/records", tags=["records"])


@router.post("/", response_model=RecordOut)
def create_record(
    record: RecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new problem record."""
    service = RecordService(db)
    db_record = service.create_record(current_user.id, record)
    return service.to_record_out(db_record)


@router.get("/", response_model=List[RecordOut])
def list_records(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tag: Optional[str] = Query(None, description="Filter by single tag"),
    tags: Optional[str] = Query(
        None, description="Filter by multiple tags (comma-separated)"
    ),
    status: Optional[str] = Query(None, description="Filter by execution status"),
    oj_type: Optional[str] = Query(None, description="Filter by OJ type"),
    oj_sync_status: Optional[str] = Query(
        None, description="Filter by OJ synchronization status"
    ),
    github_sync_status: Optional[str] = Query(
        None, description="Filter by GitHub synchronization status"
    ),
    ai_analysis_status: Optional[str] = Query(
        None, description="Filter by AI analysis status"
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
    query = db.query(models.Record).filter(models.Record.user_id == current_user.id)

    # Tag filtering
    if tag:
        query = query.join(models.Record.tags).filter(models.Tag.name == tag)
    elif tags:
        tag_names = [t.strip() for t in tags.split(",") if t.strip()]
        query = query.join(models.Record.tags).filter(models.Tag.name.in_(tag_names))

    # Status filtering
    if github_sync_status:
        query = query.filter(models.Record.github_sync_status == github_sync_status)
    if oj_sync_status:
        query = query.filter(models.Record.oj_sync_status == oj_sync_status)
    if ai_analysis_status:
        query = query.filter(models.Record.ai_analysis_status == ai_analysis_status)
    if status:
        query = query.filter(models.Record.execution_result == status)
    if oj_type:
        query = query.filter(models.Record.oj_type == oj_type)
    if language:
        query = query.filter(models.Record.language == language)
    if problem_title:
        query = query.filter(models.Record.problem_title.ilike(f"%{problem_title}%"))
    if problem_id:
        query = query.filter(models.Record.problem_id == problem_id)

    # Time filtering
    if start_time:
        try:
            start_dt = datetime.fromisoformat(start_time)
            query = query.filter(models.Record.submit_time >= start_dt)
        except ValueError:
            logger.warning(f"Invalid start_time format: {start_time}")
    if end_time:
        try:
            end_dt = datetime.fromisoformat(end_time)
            query = query.filter(models.Record.submit_time <= end_dt)
        except ValueError:
            logger.warning(f"Invalid end_time format: {end_time}")

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
        query = query.order_by(sort_column.asc().nullslast())
    else:
        query = query.order_by(sort_column.desc().nullslast())

    # Pagination
    query = query.offset(offset).limit(limit)

    records = query.all()
    return [service.to_record_out(r) for r in records]


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

    # Unique problems (deduplicate by problem_title)
    unique_problems = (
        db.query(func.count(func.distinct(models.Record.problem_title)))
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


@router.get("/{id}", response_model=RecordOut)
def get_record(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific problem record by ID."""
    service = RecordService(db)
    db_record = service.get_record(id)
    if not db_record or db_record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Record not found")
    return service.to_record_out(db_record)


@router.put("/{id}", response_model=RecordOut)
def update_record(
    id: int,
    record: RecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update a problem record."""
    service = RecordService(db)
    db_record = service.get_record(id)
    if not db_record or db_record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Record not found")

    # Update record fields
    db_record.oj_type = record.oj_type
    db_record.problem_title = record.problem_title
    db_record.execution_result = record.execution_result
    db_record.oj_status = record.oj_status
    db_record.language = record.language
    db_record.code = record.code
    db_record.submit_time = record.submit_time
    db_record.submission_url = record.submission_url
    db_record.runtime = record.runtime
    db_record.memory = record.memory
    db_record.runtime_percentile = record.runtime_percentile
    db_record.memory_percentile = record.memory_percentile
    db_record.total_correct = record.total_correct
    db_record.total_testcases = record.total_testcases
    db_record.topic_tags = record.topic_tags

    db.commit()
    db.refresh(db_record)
    return service.to_record_out(db_record)


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


@router.post("/{id}/tags", response_model=RecordOut)
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
    return service.to_record_out(updated_record)


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
