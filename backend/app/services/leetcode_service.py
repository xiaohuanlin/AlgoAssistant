from typing import Any, Dict, Optional

from app.schemas.leetcode import LeetCodeConfig
from app.utils.logger import get_logger

from .base_oj_service import BaseOJService
from .leetcode_graphql_service import LeetCodeGraphQLService

logger = get_logger(__name__)


class LeetCodeService(BaseOJService[LeetCodeConfig]):
    """LeetCode integration service using GraphQL API."""

    def __init__(self, config: LeetCodeConfig):
        super().__init__(config)
        assert config.session_cookie is not None, "Session cookie is required"
        self.service: LeetCodeGraphQLService = LeetCodeGraphQLService(
            str(config.session_cookie)
        )

    def test_connection(self) -> bool:
        return self.service.test_connection()

    def fetch_user_submissions(self, max_submissions: Optional[int] = None):
        yield from self.service.get_all_user_submissions(
            max_submissions=max_submissions
        )

    def fetch_user_submissions_detail(self, submission_id: int):
        return self.service.get_submission_details(submission_id)

    def fetch_problem_detail(self, title_slug: str):
        return self.service.get_problem_detail(title_slug)

    def get_user_profile(self, username: Optional[str] = None) -> Dict[str, Any]:
        return self.service.get_user_profile(username)
