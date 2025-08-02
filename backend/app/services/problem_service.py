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
        problem = models.Problem(**problem_in.model_dump())
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

        # Filter by user's submissions (only_self functionality)
        if user:
            subq = (
                self.db.query(models.Record.problem_id)
                .filter(models.Record.user_id == user.id)
                .distinct()
            )
            query = query.filter(models.Problem.id.in_(subq))
        elif records_only:
            # If records_only is True but no specific user, show problems with any records
            subq = self.db.query(models.Record.problem_id).distinct()
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
            problem = models.Problem(**p.model_dump())
            self.db.add(problem)
            problems.append(problem)
        self.db.commit()
        for problem in problems:
            self.db.refresh(problem)
        return problems

    def get_problem_bank_stats(self, user: models.User) -> dict:
        """Get problem bank statistics for a specific user"""
        # Total problems count
        total_problems = self.db.query(models.Problem).count()

        # Problems by difficulty
        easy_problems = (
            self.db.query(models.Problem)
            .filter(models.Problem.difficulty == "Easy")
            .count()
        )
        medium_problems = (
            self.db.query(models.Problem)
            .filter(models.Problem.difficulty == "Medium")
            .count()
        )
        hard_problems = (
            self.db.query(models.Problem)
            .filter(models.Problem.difficulty == "Hard")
            .count()
        )

        # Problems by source
        leetcode_problems = (
            self.db.query(models.Problem)
            .filter(models.Problem.source == "leetcode")
            .count()
        )
        custom_problems = (
            self.db.query(models.Problem)
            .filter(models.Problem.source == "custom")
            .count()
        )

        # User-specific statistics
        # Get distinct problems that user has solved (has accepted records)
        solved_problems_query = (
            self.db.query(models.Record.problem_id)
            .filter(
                models.Record.user_id == user.id,
                models.Record.execution_result == "Accepted",
            )
            .distinct()
        )
        solved_problems = solved_problems_query.count()

        # Total attempts by user
        total_attempts = (
            self.db.query(models.Record)
            .filter(models.Record.user_id == user.id)
            .count()
        )

        # Calculate solve rate
        solve_rate = solved_problems / total_problems if total_problems > 0 else 0

        # Total reviews by user
        total_reviews = (
            self.db.query(models.Review)
            .filter(models.Review.user_id == user.id)
            .count()
        )

        return {
            "total_problems": total_problems,
            "easy_problems": easy_problems,
            "medium_problems": medium_problems,
            "hard_problems": hard_problems,
            "leetcode_problems": leetcode_problems,
            "custom_problems": custom_problems,
            "solved_problems": solved_problems,
            "total_attempts": total_attempts,
            "solve_rate": solve_rate,
            "total_reviews": total_reviews,
        }

    def get_problem_statistics(self, problem_id: int, user: models.User) -> dict:
        """Get statistics for a specific problem and user"""
        from app import models

        # Check if problem exists
        problem = (
            self.db.query(models.Problem)
            .filter(models.Problem.id == problem_id)
            .first()
        )
        if not problem:
            raise ValueError("Problem not found")

        # Get all records for this problem by this user
        records = (
            self.db.query(models.Record)
            .filter(
                models.Record.problem_id == problem_id, models.Record.user_id == user.id
            )
            .all()
        )

        total_attempts = len(records)
        successful_attempts = len(
            [r for r in records if r.execution_result == "Accepted"]
        )
        success_rate = (
            successful_attempts / total_attempts if total_attempts > 0 else 0.0
        )

        # Get best time and memory from successful attempts
        successful_records = [r for r in records if r.execution_result == "Accepted"]
        best_time = None
        best_memory = None

        if successful_records:
            # Find best runtime (lowest)
            runtimes = [r.runtime for r in successful_records if r.runtime]
            if runtimes:
                best_time = min(runtimes)

            # Find best memory (lowest)
            memories = [r.memory for r in successful_records if r.memory]
            if memories:
                best_memory = min(memories)

        # Get total reviews for this problem by this user
        total_reviews = (
            self.db.query(models.Review)
            .filter(
                models.Review.problem_id == problem_id, models.Review.user_id == user.id
            )
            .count()
        )

        # Get last attempt date
        last_attempt_date = None
        if records:
            last_record = max(records, key=lambda r: r.submit_time)
            last_attempt_date = last_record.submit_time

        return {
            "total_attempts": total_attempts,
            "successful_attempts": successful_attempts,
            "success_rate": success_rate,
            "best_time": best_time,
            "best_memory": best_memory,
            "total_reviews": total_reviews,
            "last_attempt_date": last_attempt_date,
        }
