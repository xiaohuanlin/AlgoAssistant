from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.schemas import (
    ProblemBankStatsOut,
    ProblemBatchCreate,
    ProblemCreate,
    ProblemOut,
    ProblemSource,
    ProblemStatisticsOut,
    ProblemUpdate,
)
from app.schemas.problem import ProblemListOut, ProblemOut, ProblemUserRecordsOut
from app.schemas.review import ReviewOut
from app.schemas.user import UserOut
from app.services.problem_service import ProblemService
from app.services.record_service import RecordService

router = APIRouter(prefix="/api/problem", tags=["problem"])


@router.post("/", response_model=ProblemOut, status_code=status.HTTP_201_CREATED)
def create_problem(
    problem_in: ProblemCreate,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    service = ProblemService(db)
    try:
        problem = service.create_problem(problem_in, user=current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ProblemOut.from_orm(problem)


@router.post(
    "/batch-create",
    response_model=List[ProblemOut],
    status_code=status.HTTP_201_CREATED,
)
def batch_create_problems(batch_in: ProblemBatchCreate, db: Session = Depends(get_db)):
    service = ProblemService(db)
    problems = service.batch_create_problems(batch_in)
    return [ProblemOut.from_orm(p) for p in problems]


@router.get("/stats", response_model=ProblemBankStatsOut)
def get_problem_bank_stats(
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    """Get problem bank statistics for the current user"""
    service = ProblemService(db)
    stats = service.get_problem_bank_stats(current_user)
    return ProblemBankStatsOut(**stats)


@router.get("/{problem_id}", response_model=ProblemOut)
def get_problem(
    problem_id: int,
    db: Session = Depends(get_db),
):
    service = ProblemService(db)
    problem = service.get_problem_by_id(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return ProblemOut.from_orm(problem)


@router.get("/{problem_id}/user-records", response_model=ProblemUserRecordsOut)
def get_problem_user_records(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    service = ProblemService(db)
    problem = service.get_problem_by_id(problem_id, user=current_user)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    record_service = RecordService(db)
    records_out = [record_service.to_record_list_out(r) for r in problem.records]
    reviews_out = [ReviewOut.from_orm(r) for r in problem.reviews]
    return ProblemUserRecordsOut(records=records_out, reviews=reviews_out)


@router.get("/{problem_id}/statistics", response_model=ProblemStatisticsOut)
def get_problem_statistics(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    """Get statistics for a specific problem and current user"""
    service = ProblemService(db)
    try:
        stats = service.get_problem_statistics(problem_id, current_user)
        return ProblemStatisticsOut(**stats)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{problem_id}", response_model=ProblemOut)
def update_problem(
    problem_id: int, problem_in: ProblemUpdate, db: Session = Depends(get_db)
):
    service = ProblemService(db)
    problem = service.update_problem(problem_id, problem_in)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return ProblemOut.from_orm(problem)


@router.delete("/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_problem(problem_id: int, db: Session = Depends(get_db)):
    service = ProblemService(db)
    ok = service.delete_problem(problem_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Problem not found")
    return


@router.get("/", response_model=ProblemListOut)
def list_problems(
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    source: Optional[ProblemSource] = Query(None),
    title: Optional[str] = Query(None),
    tags: Optional[str] = Query(None, description="Comma separated tags"),
    difficulty: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    records_only: bool = Query(False, description="Only show problems with records"),
    only_self: bool = Query(
        False, description="Only show problems with user's own records"
    ),
):
    service = ProblemService(db)
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None
    total, problems = service.list_problems(
        skip=skip,
        limit=limit,
        source=source,
        title=title,
        tags=tag_list,
        difficulty=difficulty,
        sort_by=sort_by,
        sort_order=sort_order,
        records_only=records_only,
        user=current_user if only_self else None,
    )
    return ProblemListOut(total=total, items=[ProblemOut.from_orm(p) for p in problems])
