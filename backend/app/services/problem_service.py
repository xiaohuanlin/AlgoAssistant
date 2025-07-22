import re
from typing import List, Optional, Tuple

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.services.leetcode_service import LeetCodeService
from app.services.user_config_service import UserConfigService


class ProblemService:
    def __init__(self, db: Session):
        self.db = db

    def create_problem(
        self, problem_in: schemas.ProblemCreate, user: models.User
    ) -> models.Problem:
        # If source is leetcode and url is provided, auto-fetch details
        if problem_in.source == schemas.ProblemSource.leetcode and problem_in.url:
            match = re.search(
                r"leetcode.com/problems/([\w-]+)(?:/description)?/?", problem_in.url
            )
            if not match:
                raise ValueError("Invalid LeetCode problem URL")
            title_slug = match.group(1)
            if not user.configs or not user.configs.leetcode_config:
                raise ValueError("LeetCode not connected")
            leetcode_service = LeetCodeService(user.configs.leetcode_config)
            detail = leetcode_service.fetch_problem_detail(title_slug)
            if not detail:
                raise ValueError("Problem not found on LeetCode")
            # Fill fields from LeetCode
            problem_in = schemas.ProblemCreate(
                source=schemas.ProblemSource.leetcode,
                source_id=str(detail.get("id")),
                title=detail.get("title"),
                title_slug=detail.get("title_slug"),
                difficulty=detail.get("difficulty"),
                tags=detail.get("topic_tags", []),
                description=detail.get("content"),
                url=problem_in.url,
            )
        problem = models.Problem(**problem_in.dict())
        self.db.add(problem)
        self.db.commit()
        self.db.refresh(problem)
        return problem

    def get_problem_by_id(
        self, problem_id: int, user: Optional[models.User] = None
    ) -> Optional[models.Problem]:
        problem = (
            self.db.query(models.Problem)
            .filter(models.Problem.id == problem_id)
            .first()
        )
        if not problem:
            return None
        if user:
            problem.records = (
                self.db.query(models.Record)
                .filter(
                    models.Record.problem_id == problem_id,
                    models.Record.user_id == user.id,
                )
                .all()
            )
            problem.reviews = (
                self.db.query(models.Review)
                .filter(
                    models.Review.problem_id == problem_id,
                    models.Review.user_id == user.id,
                )
                .all()
            )
        else:
            problem.records = (
                self.db.query(models.Record)
                .filter(models.Record.problem_id == problem_id)
                .all()
            )
            problem.reviews = (
                self.db.query(models.Review)
                .filter(models.Review.problem_id == problem_id)
                .all()
            )
        return problem

    def get_problem_by_title_slug(
        self, title_slug: str, user: Optional[models.User] = None
    ) -> Optional[models.Problem]:
        problem = (
            self.db.query(models.Problem)
            .filter(models.Problem.title_slug == title_slug)
            .first()
        )
        if not problem:
            return None
        if user:
            problem.records = (
                self.db.query(models.Record)
                .filter(
                    models.Record.problem_id == problem.id,
                    models.Record.user_id == user.id,
                )
                .all()
            )
            problem.reviews = (
                self.db.query(models.Review)
                .filter(
                    models.Review.problem_id == problem.id,
                    models.Review.user_id == user.id,
                )
                .all()
            )
        else:
            problem.records = (
                self.db.query(models.Record)
                .filter(models.Record.problem_id == problem.id)
                .all()
            )
            problem.reviews = (
                self.db.query(models.Review)
                .filter(models.Review.problem_id == problem.id)
                .all()
            )
        return problem

    def update_problem(
        self, problem_id: int, problem_in: schemas.ProblemUpdate
    ) -> Optional[models.Problem]:
        problem = self.get_problem_by_id(problem_id)
        if not problem:
            return None
        for field, value in problem_in.dict(exclude_unset=True).items():
            setattr(problem, field, value)
        self.db.commit()
        self.db.refresh(problem)
        return problem

    def delete_problem(self, problem_id: int) -> bool:
        problem = self.get_problem_by_id(problem_id)
        if not problem:
            return False
        self.db.delete(problem)
        self.db.commit()
        return True

    def list_problems(
        self,
        skip: int = 0,
        limit: int = 100,
        source: Optional[str] = None,
        title: Optional[str] = None,
        tags: Optional[List[str]] = None,
        difficulty: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        records_only: bool = False,
        user: Optional[models.User] = None,
    ) -> Tuple[int, List[models.Problem]]:
        query = self.db.query(models.Problem)
        if source:
            query = query.filter(models.Problem.source == source)
        if title:
            query = query.filter(models.Problem.title.ilike(f"%{title}%"))
        if tags:
            for tag in tags:
                query = query.filter(models.Problem.tags.contains([tag]))
        if difficulty:
            query = query.filter(models.Problem.difficulty == difficulty)
        if records_only:
            subq = self.db.query(models.Record.problem_id)
            if user:
                subq = subq.filter(models.Record.user_id == user.id)
            subq = subq.distinct()
            query = query.filter(models.Problem.id.in_(subq))
        total = query.count()
        sort_column = getattr(models.Problem, sort_by, models.Problem.created_at)
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        problems = query.offset(skip).limit(limit).all()
        return total, problems

    def batch_create_problems(
        self, problems_in: List[schemas.ProblemCreate]
    ) -> List[models.Problem]:
        problems = []
        for p in problems_in:
            problem = models.Problem(**p.dict())
            self.db.add(problem)
            problems.append(problem)
        self.db.commit()
        for problem in problems:
            self.db.refresh(problem)
        return problems
