import logging
from typing import List, Dict, Any
from .leetcode_graphql_service import LeetCodeGraphQLService

logger = logging.getLogger(__name__)

class LeetCodeService:
    """LeetCode integration service using GraphQL API."""
    def __init__(self):
        self.service = None

    def _get_service(self, session_cookie: str = None):
        """Get or create GraphQL service instance"""
        if not self.service:
            self.service = LeetCodeGraphQLService(session_cookie)
        elif session_cookie:
            # Update session cookie if provided
            self.service.session.cookies.set('LEETCODE_SESSION', session_cookie, domain='.leetcode.com')
        return self.service

    def test_connection(self) -> Dict[str, Any]:
        """Test connection to LeetCode GraphQL API"""
        service = self._get_service()
        return service.test_connection()

    def test_authentication(self, session_cookie: str) -> Dict[str, Any]:
        """Test authentication with session cookie"""
        service = self._get_service(session_cookie)
        return service.test_authentication(session_cookie)

    def get_user_submissions(self, max_submissions: int = None) -> List[Dict[str, Any]]:
        """Get user submissions"""
        service = self._get_service()
        return service.get_all_user_submissions_sync(max_submissions=max_submissions)

    def get_submission_code(self, submission_url: str) -> str:
        """Get submission code by extracting ID from URL"""
        try:
            # Extract submission ID from URL
            import re
            match = re.search(r'/submissions/detail/(\d+)/', submission_url)
            if match:
                submission_id = match.group(1)
                service = self._get_service()
                return service.get_submission_code_sync(submission_id)
            else:
                logger.error(f"Could not extract submission ID from URL: {submission_url}")
                return "# Code not available"
        except Exception as e:
            logger.error(f"Error getting submission code: {e}")
            return "# Code not available"

    def fetch_user_submissions_with_cookies(self, username: str, session_cookie: str, csrf_token: str = None, use_playwright: bool = True, max_submissions: int = None, offset: int = 0) -> List[Dict[str, Any]]:
        logger.info(f"Fetching submissions for user {username} using GraphQL API (max: {max_submissions if max_submissions else 'unlimited'}, offset: {offset})")
        if not use_playwright:
            logger.warning("use_playwright=False ignored, always using GraphQL API for consistency")
        try:
            service = self._get_service(session_cookie)
            submissions = service.fetch_user_submissions_with_cookie(session_cookie, max_submissions=max_submissions)
            logger.info(f"Successfully fetched {len(submissions)} submissions for user {username}")
            return submissions
        except Exception as e:
            logger.error(f"Error fetching submissions for user {username}: {e}")
            raise Exception(f"Failed to fetch submissions: {str(e)}")
    
    def close(self):
        """Close the service"""
        if self.service:
            self.service.close()
            self.service = None 