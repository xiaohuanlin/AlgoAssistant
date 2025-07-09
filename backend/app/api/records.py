from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas import RecordCreate, RecordOut, TagOut
from app.services.record_service import RecordService
from app.deps import get_db, get_current_user
from app.services.service_factory import ServiceFactory
from app.models import Tag

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
        tag_obj = db.query(Tag).filter(Tag.name == tag).first()
        if not tag_obj:
            return []
        records = db.query(Tag).filter(Tag.name == tag).all()
    elif tags:
        tag_names = [t.strip() for t in tags.split(",") if t.strip()]
        records = db.query(Tag).filter(Tag.name.in_(tag_names)).all()
    else:
        records = service.get_records(current_user.id)
    return [service.to_record_out(r) for r in records]

@router.get("/{record_id}", response_model=RecordOut)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = RecordService(db)
    db_record = service.get_record(current_user.id, record_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    return service.to_record_out(db_record)

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

@router.post("/{record_id}/analyze", response_model=dict)
def analyze_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = RecordService(db)
    db_record = service.get_record(current_user.id, record_id)
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

@router.post("/{record_id}/tags", response_model=RecordOut)
def assign_tags(
    record_id: int,
    tag_names: List[str] = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = RecordService(db)
    db_record = service.get_record(current_user.id, record_id)
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