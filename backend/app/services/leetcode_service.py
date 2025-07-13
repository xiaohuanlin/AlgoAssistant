from typing import Any, Dict, Generator, List, Optional

from app.schemas.leetcode import LeetCodeConfig
from app.utils.logger import get_logger

from .base_oj_service import BaseOJService
from .leetcode_graphql_service import LeetCodeGraphQLService

logger = get_logger(__name__)


class LeetCodeService(BaseOJService):
    """LeetCode integration service using GraphQL API."""

    def __init__(self, config: LeetCodeConfig):
        super().__init__(config)
        assert config.session_cookie is not None, "Session cookie is required"
        self.service: LeetCodeGraphQLService = LeetCodeGraphQLService(
            config.session_cookie
        )

    def test_connection(self) -> bool:
        return self.service.test_connection()

    def fetch_user_submissions(self) -> Generator[List[Dict[str, Any]], None, None]:
        yield from self.service.get_all_user_submissions()

    def fetch_user_submissions_detail(self, submission_id: int) -> Dict[str, Any]:
        return self.service.get_submission_details(submission_id)

    def fetch_problem_detail(self, title_slug: str) -> Optional[Dict[str, Any]]:
        return self.service.get_problem_detail(title_slug)
