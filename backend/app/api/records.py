from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas import RecordCreate, RecordOut, TagOut
from app.services.record_service import RecordService
from app.deps import get_db, get_current_user
from app.services.service_factory import ServiceFactory
from app.models import Tag
from app import models
from sqlalchemy import func

router = APIRouter(prefix="/api/records", tags=["records"])

@router.post("/", response_model=RecordOut)
def create_record(
    record: RecordCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = RecordService(db)
    db_record = service.create_record(current_user.id, record)
    return db_record

@router.get("/", response_model=List[RecordOut])
def list_records(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tag: Optional[str] = Query(None),
    tags: Optional[str] = Query(None)
):
    service = RecordService(db)
    if tag:
        # Get records with specific tag
        records = db.query(models.Record).join(
            models.Record.tags
        ).filter(
            models.Record.user_id == current_user.id,
            models.Tag.name == tag
        ).all()
    elif tags:
        # Get records with any of the specified tags
        tag_names = [t.strip() for t in tags.split(",") if t.strip()]
        records = db.query(models.Record).join(
            models.Record.tags
        ).filter(
            models.Record.user_id == current_user.id,
            models.Tag.name.in_(tag_names)
        ).all()
    else:
        # Get all records for user
        records = service.get_records(current_user.id)
    
    # Sort by submit time in descending order to show latest submissions first
    records.sort(key=lambda x: x.submit_time or x.created_at, reverse=True)
    return [service.to_record_out(r) for r in records]

@router.get("/stats")
def get_records_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get statistics for user's records."""
    
    # Total records
    total = db.query(func.count(models.Record.submission_id)).filter(
        models.Record.user_id == current_user.id
    ).scalar()
    
    # Solved records (Accepted status)
    solved = db.query(func.count(models.Record.submission_id)).filter(
        models.Record.user_id == current_user.id,
        models.Record.status == "Accepted"
    ).scalar()
    
    # Success rate
    success_rate = (solved / total * 100) if total > 0 else 0
    
    # Unique languages used
    languages = db.query(func.count(func.distinct(models.Record.language))).filter(
        models.Record.user_id == current_user.id
    ).scalar()

    # Unique problems (deduplicate by problem_title)
    unique_problems = db.query(func.count(func.distinct(models.Record.problem_title))).filter(
        models.Record.user_id == current_user.id
    ).scalar()
    
    return {
        "total": total,
        "solved": solved,
        "successRate": round(success_rate, 1),
        "languages": languages,
        "unique_problems": unique_problems
    }

@router.get("/{submission_id}", response_model=RecordOut)
def get_record(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = RecordService(db)
    db_record = service.get_record(current_user.id, submission_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    return service.to_record_out(db_record)

@router.put("/{submission_id}", response_model=RecordOut)
def update_record(
    submission_id: int,
    record: RecordCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = RecordService(db)
    db_record = service.get_record(current_user.id, submission_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    # Update record fields
    db_record.oj_type = record.oj_type
    db_record.problem_title = record.problem_title
    db_record.status = record.status
    db_record.sync_status = record.sync_status
    db_record.language = record.language
    db_record.code = record.code
    db_record.submit_time = record.submit_time
    
    db.commit()
    db.refresh(db_record)
    return service.to_record_out(db_record)

@router.delete("/{submission_id}")
def delete_record(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = RecordService(db)
    db_record = service.get_record(current_user.id, submission_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db.delete(db_record)
    db.commit()
    return {"message": "Record deleted successfully"}

@router.post("/analyze/batch", response_model=List[dict])
def batch_analyze_records(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_config = {"ai_type": "openai"}
    factory = ServiceFactory(user_config)
    ai_service = factory.ai_service
    service = RecordService(db)
    results = service.batch_analyze_records_with_ai(current_user.id, ai_service)
    return results

@router.post("/{submission_id}/analyze", response_model=dict)
def analyze_record(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = RecordService(db)
    db_record = service.get_record(current_user.id, submission_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    user_config = {"ai_type": "openai"}
    factory = ServiceFactory(user_config)
    ai_service = factory.ai_service
    ai_result = ai_service.analyze_code(db_record.code, current_user.id, db_record.problem_title, db_record.language)
    if "error" not in ai_result:
        db_record.ai_analysis = ai_result
        db.commit()
        db.refresh(db_record)
    return ai_result

@router.get("/tags", response_model=List[TagOut])
def list_tags(
    db: Session = Depends(get_db)
):
    service = RecordService(db)
    tags = service.get_tags()
    return tags

@router.post("/{submission_id}/tags", response_model=RecordOut)
def assign_tags(
    submission_id: int,
    tag_names: List[str] = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = RecordService(db)
    db_record = service.get_record(current_user.id, submission_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    updated_record = service.assign_tags_to_record(db_record, tag_names)
    return service.to_record_out(updated_record)

@router.put("/tags/{tag_id}/wiki", response_model=TagOut)
def update_tag_wiki(
    tag_id: int,
    wiki: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    tag.wiki = wiki
    db.commit()
    db.refresh(tag)
    return tag

# Placeholder for problem record endpoints
# Future: CRUD for problem records, AI analysis, etc. 