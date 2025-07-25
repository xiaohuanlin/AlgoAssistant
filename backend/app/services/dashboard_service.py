import logging
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple

from sqlalchemy import and_, case, distinct, func
from sqlalchemy.orm import Session

from app import models

logger = logging.getLogger(__name__)


class DashboardService:
    """Service for dashboard statistics and analytics."""

    def __init__(self, db: Session):
        self.db = db

    def get_basic_stats(self, user_id: int) -> Dict:
        """Get basic dashboard statistics for a user.

        Args:
            user_id: User ID

        Returns:
            Dict containing basic statistics
        """
        try:
            # Total records count
            total_records = (
                self.db.query(func.count(models.Record.id))
                .filter(models.Record.user_id == user_id)
                .scalar()
            ) or 0

            # Solved records count (Accepted status)
            solved_records = (
                self.db.query(func.count(models.Record.id))
                .filter(
                    models.Record.user_id == user_id,
                    models.Record.execution_result == "Accepted",
                )
                .scalar()
            ) or 0

            # Unique problems solved
            unique_problems = (
                self.db.query(func.count(distinct(models.Record.problem_id)))
                .filter(
                    models.Record.user_id == user_id,
                    models.Record.execution_result == "Accepted",
                    models.Record.problem_id.isnot(None),
                )
                .scalar()
            ) or 0

            # Review problems due today
            review_due_count = (
                self.db.query(func.count(models.Review.id))
                .filter(
                    models.Review.user_id == user_id,
                    models.Review.next_review_date <= datetime.utcnow(),
                )
                .scalar()
            ) or 0

            # Calculate streak days
            streak_days = self._calculate_streak_days(user_id)

            # This week solved count
            week_solved = self._get_week_solved_count(user_id)

            # This month solved count
            month_solved = self._get_month_solved_count(user_id)

            return {
                "totalProblems": total_records,
                "solvedProblems": solved_records,
                "uniqueProblems": unique_problems,
                "reviewProblems": review_due_count,
                "streakDays": streak_days,
                "thisWeekSolved": week_solved,
                "thisMonthSolved": month_solved,
                "successRate": (solved_records / total_records * 100)
                if total_records > 0
                else 0.0,
            }

        except Exception as e:
            logger.error(f"Failed to get basic stats for user {user_id}: {e}")
            raise

    def get_category_stats(self, user_id: int) -> List[Dict]:
        """Get algorithm category statistics based on topic_tags and AI analysis.

        Args:
            user_id: User ID

        Returns:
            List of category statistics
        """
        try:
            records = (
                self.db.query(models.Record)
                .filter(models.Record.user_id == user_id)
                .all()
            )

            category_stats = {}

            for record in records:
                categories = self._extract_categories(record)

                for category in categories:
                    if category not in category_stats:
                        category_stats[category] = {
                            "category": category,
                            "totalCount": 0,
                            "solvedCount": 0,
                            "errorCount": 0,
                            "lastPracticeDate": None,
                        }

                    stats = category_stats[category]
                    stats["totalCount"] += 1

                    if record.execution_result == "Accepted":
                        stats["solvedCount"] += 1
                    else:
                        stats["errorCount"] += 1

                    # Update last practice date
                    if record.submit_time:
                        if (
                            not stats["lastPracticeDate"]
                            or record.submit_time > stats["lastPracticeDate"]
                        ):
                            stats["lastPracticeDate"] = record.submit_time

            # Calculate completion rates and error rates
            for stats in category_stats.values():
                total = stats["totalCount"]
                stats["completionRate"] = (
                    (stats["solvedCount"] / total * 100) if total > 0 else 0
                )
                stats["errorRate"] = (
                    (stats["errorCount"] / total * 100) if total > 0 else 0
                )

            return list(category_stats.values())

        except Exception as e:
            logger.error(f"Failed to get category stats for user {user_id}: {e}")
            raise

    def get_recent_activity(self, user_id: int, limit: int = 10) -> List[Dict]:
        """Get recent submission activity.

        Args:
            user_id: User ID
            limit: Maximum number of records to return

        Returns:
            List of recent submission records
        """
        try:
            records = (
                self.db.query(models.Record)
                .filter(models.Record.user_id == user_id)
                .order_by(models.Record.submit_time.desc().nullslast())
                .limit(limit)
                .all()
            )

            activity_list = []
            for record in records:
                # Get problem title
                problem_title = "Unknown Problem"
                if record.problem and record.problem.title:
                    problem_title = record.problem.title
                elif record.problem_id:
                    problem_title = f"Problem {record.problem_id}"

                # Extract primary category
                categories = self._extract_categories(record)
                primary_category = categories[0] if categories else "Uncategorized"

                activity_list.append(
                    {
                        "id": record.id,
                        "problemId": record.problem_id,
                        "problemTitle": problem_title,
                        "submissionTime": record.submit_time,
                        "status": record.execution_result,
                        "language": record.language,
                        "runtime": record.runtime,
                        "memory": record.memory,
                        "category": primary_category,
                    }
                )

            return activity_list

        except Exception as e:
            logger.error(f"Failed to get recent activity for user {user_id}: {e}")
            raise

    def get_error_analysis(self, user_id: int) -> Dict:
        """Get error analysis and review statistics.

        Args:
            user_id: User ID

        Returns:
            Dict containing error analysis data
        """
        try:
            # Get recent error records
            error_records = (
                self.db.query(models.Record)
                .filter(
                    models.Record.user_id == user_id,
                    models.Record.execution_result != "Accepted",
                )
                .order_by(models.Record.submit_time.desc().nullslast())
                .limit(20)
                .all()
            )

            # Get reviews for these records
            problem_ids = [r.problem_id for r in error_records if r.problem_id]
            reviews_query = (
                (
                    self.db.query(models.Review)
                    .filter(
                        models.Review.user_id == user_id,
                        models.Review.problem_id.in_(problem_ids),
                    )
                    .all()
                )
                if problem_ids
                else []
            )

            review_map = {r.problem_id: r for r in reviews_query}

            recent_errors = []
            for record in error_records:
                if not record.problem_id:
                    continue

                review = review_map.get(record.problem_id)
                problem_title = "Unknown Problem"
                if record.problem and record.problem.title:
                    problem_title = record.problem.title
                else:
                    problem_title = f"Problem {record.problem_id}"

                recent_errors.append(
                    {
                        "problemId": record.problem_id,
                        "problemTitle": problem_title,
                        "errorDate": record.submit_time or record.created_at,
                        "errorType": record.execution_result,
                        "reviewCount": review.review_count if review else 0,
                        "needsReview": review.next_review_date <= datetime.utcnow()
                        if review
                        else True,
                    }
                )

            return {
                "recentErrors": recent_errors,
                "totalErrorCount": len(error_records),
            }

        except Exception as e:
            logger.error(f"Failed to get error analysis for user {user_id}: {e}")
            raise

    def get_progress_trend(self, user_id: int, days: int = 30) -> List[Dict]:
        """Get progress trend data for the specified number of days.

        Args:
            user_id: User ID
            days: Number of days to include in trend

        Returns:
            List of daily progress data
        """
        try:
            start_date = datetime.utcnow().date() - timedelta(days=days)

            # Get daily submission counts
            daily_data = (
                self.db.query(
                    func.date(models.Record.submit_time).label("date"),
                    func.count(models.Record.id).label("total_submissions"),
                    func.sum(
                        case((models.Record.execution_result == "Accepted", 1), else_=0)
                    ).label("solved_count"),
                )
                .filter(
                    models.Record.user_id == user_id,
                    func.date(models.Record.submit_time) >= start_date,
                )
                .group_by(func.date(models.Record.submit_time))
                .order_by(func.date(models.Record.submit_time))
                .all()
            )

            # Create complete date range with zero values for missing dates
            date_range = []
            current_date = start_date
            end_date = datetime.utcnow().date()

            data_map = {item.date: item for item in daily_data}

            while current_date <= end_date:
                data_item = data_map.get(current_date)
                date_range.append(
                    {
                        "date": current_date.isoformat(),
                        "totalSubmissions": int(data_item.total_submissions)
                        if data_item
                        else 0,
                        "solvedCount": int(data_item.solved_count) if data_item else 0,
                    }
                )
                current_date += timedelta(days=1)

            return date_range

        except Exception as e:
            logger.error(f"Failed to get progress trend for user {user_id}: {e}")
            raise

    def _extract_categories(self, record: models.Record) -> List[str]:
        """Extract categories from record topic_tags and AI analysis.

        Args:
            record: Record instance

        Returns:
            List of category names
        """
        categories = []

        # Extract from topic_tags
        if record.topic_tags and isinstance(record.topic_tags, list):
            categories.extend([tag for tag in record.topic_tags if tag])

        # Extract from AI analysis
        if record.ai_analysis and isinstance(record.ai_analysis, dict):
            algorithm_type = record.ai_analysis.get("algorithm_type")
            if algorithm_type and algorithm_type not in categories:
                categories.append(algorithm_type)

        return categories if categories else ["Uncategorized"]

    def _calculate_streak_days(self, user_id: int) -> int:
        """Calculate consecutive days with accepted submissions.

        Args:
            user_id: User ID

        Returns:
            Number of consecutive streak days
        """
        try:
            # Get dates with accepted submissions
            submission_dates = (
                self.db.query(func.date(models.Record.submit_time).label("date"))
                .filter(
                    models.Record.user_id == user_id,
                    models.Record.execution_result == "Accepted",
                    models.Record.submit_time.isnot(None),
                )
                .distinct()
                .order_by(func.date(models.Record.submit_time).desc())
                .all()
            )

            if not submission_dates:
                return 0

            dates = [item.date for item in submission_dates]
            streak = 0
            current_date = date.today()

            # Check if there was activity today or yesterday
            if dates[0] != current_date and dates[0] != current_date - timedelta(
                days=1
            ):
                return 0

            # Start from yesterday if no activity today
            if dates[0] != current_date:
                current_date = current_date - timedelta(days=1)

            # Count consecutive days
            for submission_date in dates:
                if submission_date == current_date:
                    streak += 1
                    current_date -= timedelta(days=1)
                else:
                    break

            return streak

        except Exception as e:
            logger.error(f"Failed to calculate streak days for user {user_id}: {e}")
            return 0

    def _get_week_solved_count(self, user_id: int) -> int:
        """Get number of problems solved this week.

        Args:
            user_id: User ID

        Returns:
            Count of problems solved this week
        """
        try:
            start_of_week = datetime.utcnow().date() - timedelta(
                days=datetime.utcnow().weekday()
            )

            count = (
                self.db.query(func.count(models.Record.id))
                .filter(
                    models.Record.user_id == user_id,
                    models.Record.execution_result == "Accepted",
                    func.date(models.Record.submit_time) >= start_of_week,
                )
                .scalar()
            )

            return count or 0

        except Exception as e:
            logger.error(f"Failed to get week solved count for user {user_id}: {e}")
            return 0

    def _get_month_solved_count(self, user_id: int) -> int:
        """Get number of problems solved this month.

        Args:
            user_id: User ID

        Returns:
            Count of problems solved this month
        """
        try:
            start_of_month = datetime.utcnow().replace(day=1).date()

            count = (
                self.db.query(func.count(models.Record.id))
                .filter(
                    models.Record.user_id == user_id,
                    models.Record.execution_result == "Accepted",
                    func.date(models.Record.submit_time) >= start_of_month,
                )
                .scalar()
            )

            return count or 0

        except Exception as e:
            logger.error(f"Failed to get month solved count for user {user_id}: {e}")
            return 0
