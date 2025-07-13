"""
LeetCode GraphQL Service
Uses GraphQL API to fetch LeetCode data without browser simulation
Based on leetcode-query implementation
"""

import random
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests

from app.utils.logger import get_logger

logger = get_logger(__name__)


class LeetCodeGraphQLService:
    """LeetCode service using GraphQL API for data fetching"""

    def __init__(self, session_cookie: str):
        assert session_cookie is not None, "Session cookie is required"
        self.session_cookie = session_cookie
        self.session = requests.Session()
        self.base_url = "https://leetcode.com"
        self.graphql_url = f"{self.base_url}/graphql"

        # Set up more realistic session headers
        self.session.headers.update(
            {
                "content-type": "application/json",
                "origin": self.base_url,
                "referer": self.base_url,
                "user-agent": "Mozilla/5.0 LeetCode API",
            }
        )

        # Set session cookie
        self.session.cookies.set(
            "LEETCODE_SESSION", session_cookie, domain=".leetcode.com"
        )

        # Initialize retry operation
        self._initialize_session()

    def _parse_cookie(self, cookie_string: str) -> dict:
        if not cookie_string:
            return {}

        result = {}
        if isinstance(cookie_string, list):
            cookie_string = "; ".join(cookie_string)

        cookies = cookie_string.split(";")
        for cookie in cookies:
            cookie = cookie.strip()
            if "=" in cookie:
                parts = cookie.split("=", 1)
                if len(parts) == 2:
                    key, value = parts
                    key = key.strip()
                    value = value.strip()

                    if key.endswith("csrftoken"):
                        result["csrftoken"] = value
                    else:
                        result[key] = value

        return result

    def _get_csrf_token(self) -> Optional[str]:
        response = self.session.get(self.graphql_url, timeout=30, allow_redirects=True)
        set_cookie = response.headers.get("set-cookie")
        if set_cookie:
            parsed_cookies = self._parse_cookie(set_cookie)
            if "csrftoken" in parsed_cookies:
                csrf_token = parsed_cookies["csrftoken"]
                return csrf_token
        return None

    def _initialize_session(self) -> bool:
        # Get CSRF token with retry
        csrf_token = self._get_csrf_token()
        if not csrf_token:
            logger.error("Failed to get CSRF token")
            return False
        self.session.cookies.set("csrftoken", csrf_token, domain=".leetcode.com")
        self.session.headers.update(
            {
                "x-csrftoken": csrf_token,
            }
        )
        return True

    def _make_graphql_request(
        self, query: str, variables: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        # Add random delay to simulate human behavior
        payload = {"query": query, "variables": variables or {}}
        response = self.session.post(self.graphql_url, json=payload, timeout=30)
        if response.headers.get("set-cookie"):
            set_cookie_header = response.headers.get("set-cookie")
            parsed_cookies = self._parse_cookie(set_cookie_header or "")
            if "csrftoken" in parsed_cookies:
                self.session.cookies.set(
                    "csrftoken", parsed_cookies["csrftoken"], domain=".leetcode.com"
                )
                self.session.headers.update(
                    {
                        "x-csrftoken": parsed_cookies["csrftoken"],
                    }
                )
        result = response.json()
        return result

    def get_user_submissions(
        self, limit: int = 20, offset: int = 0
    ) -> List[Dict[str, Any]]:
        # GraphQL query for submissions
        query = """
        query ($offset: Int!, $limit: Int!, $slug: String) {
            submissionList(offset: $offset, limit: $limit, questionSlug: $slug) {
                hasNext
                submissions {
                    id
                    lang
                    time
                    timestamp
                    statusDisplay
                    runtime
                    url
                    isPending
                    title
                    memory
                    titleSlug
                }
            }
        }
        """
        variables = {"offset": offset, "limit": limit, "slug": None}
        result = self._make_graphql_request(query, variables)
        if not result or "data" not in result:
            logger.error("Failed to fetch submissions")
            return []
        submission_list = result["data"].get("submissionList", {})
        submissions = submission_list.get("submissions", [])
        # Transform submissions to our format
        transformed_submissions = []
        seen_submission_ids = set()
        for sub in submissions:
            logger.info(f"Processing submission: {sub}")
            submission_id = int(sub.get("id", 0))
            timestamp = int(sub.get("timestamp", 0)) * 1000
            status = sub.get("statusDisplay", "Unknown")
            is_pending = sub.get("isPending", "Not Pending") != "Not Pending"
            runtime = sub.get("runtime", "Unknown")
            memory = sub.get("memory", "Unknown")
            title = sub.get("title", "Unknown")
            lang = sub.get("lang", "Unknown")
            title_slug = sub.get("titleSlug", "Unknown")
            if submission_id in seen_submission_ids:
                continue
            seen_submission_ids.add(submission_id)
            submit_time = None
            if timestamp:
                submit_time = datetime.fromtimestamp(timestamp / 1000)
            submission_url = f"{self.base_url}/submissions/detail/{submission_id}/"
            transformed_submission = {
                "oj_type": "leetcode",
                "problem_title": title,
                "problem_title_slug": title_slug,
                "status": status,
                "sync_status": "pending",
                "language": lang,
                "runtime": runtime,
                "memory": memory,
                "submit_time": submit_time,
                "submission_url": submission_url,
                "submission_id": submission_id,
                "code": "",
                "topic_tags": [],
                "is_pending": is_pending,
            }
            transformed_submissions.append(transformed_submission)
        logger.info(f"Fetched {len(transformed_submissions)} submissions")
        return transformed_submissions

    def get_all_user_submissions(
        self, max_submissions: Optional[int] = None, batch_size: int = 20
    ):
        offset = 0
        total_yielded = 0
        limit = batch_size  # LeetCode API limit per request
        while True:
            logger.info(f"Fetching submissions with offset {offset}, limit {limit}")
            submissions = self.get_user_submissions(limit, offset)
            if not submissions:
                logger.info("No more submissions found")
                break
            if max_submissions is not None:
                remain = max_submissions - total_yielded
                if remain <= 0:
                    break
                if len(submissions) > remain:
                    submissions = submissions[:remain]
            yield submissions
            total_yielded += len(submissions)
            if max_submissions and total_yielded >= max_submissions:
                logger.info(f"Reached max submissions limit: {max_submissions}")
                break
            if len(submissions) < limit:
                logger.info("Reached end of submissions")
                break
            offset += limit

    def get_submission_details(self, submission_id: int) -> Dict[str, Any]:
        # GraphQL query for submission detail
        query = """
        query submissionDetails($id: Int!) {
            submissionDetails(submissionId: $id) {
                id
                runtimePercentile
                memoryPercentile
                code
                question {
                    questionId
                    titleSlug
                    hasFrontendPreview
                }
                notes
                flagType
                topicTags {
                    tagId
                    slug
                    name
                }
                runtimeError
                compileError
                codeOutput
                expectedOutput
                totalCorrect
                totalTestcases
                fullCodeOutput
                testDescriptions
                testBodies
                testInfo
            }
        }
        """
        variables = {"id": submission_id}
        result = self._make_graphql_request(query, variables)
        if not result or "data" not in result:
            logger.error(f"Failed to fetch submission details for ID {submission_id}")
            return {}
        logger.info(f"Submission details: {result}")
        submission_details = result["data"].get("submissionDetails", {})
        if not submission_details:
            logger.warning(f"No details found for submission {submission_id}")
            return {}
        topic_tags_info = submission_details.get("topicTags", [])
        topic_tags = []
        for topic_tag in topic_tags_info:
            topic_tags.append(topic_tag.get("name", ""))
        code = submission_details.get("code", "")
        runtime_percentile = submission_details.get("runtimePercentile")
        memory_percentile = submission_details.get("memoryPercentile")
        total_correct = submission_details.get("totalCorrect", 0)
        total_testcases = submission_details.get("totalTestcases", 0)
        runtime_error = submission_details.get("runtimeError")
        compile_error = submission_details.get("compileError")
        code_output = submission_details.get("codeOutput", "")
        expected_output = submission_details.get("expectedOutput", "")
        success_rate = (
            (total_correct / total_testcases * 100) if total_testcases > 0 else 0
        )
        enhanced_details = {
            "id": submission_details.get("id"),
            "code": code,
            "topic_tags": topic_tags,
            "runtime_percentile": runtime_percentile,
            "memory_percentile": memory_percentile,
            "total_correct": total_correct,
            "total_testcases": total_testcases,
            "success_rate": round(success_rate, 2),
            "runtime_error": runtime_error,
            "compile_error": compile_error,
            "code_output": code_output,
            "expected_output": expected_output,
        }
        logger.info(
            f"Successfully fetched enhanced details for submission {submission_id}"
        )
        logger.info(
            f"Test cases: {total_correct}/{total_testcases} ({success_rate}% success rate)"
        )
        return enhanced_details

    def get_user_profile(self, username: Optional[str] = None) -> Dict[str, Any]:
        # If no username provided, we need to get it from the session
        if not username:
            current_user_query = """
            query {
                userStatus {
                    isSignedIn
                    username
                }
            }
            """
            current_user_result = self._make_graphql_request(current_user_query)
            if not current_user_result or "data" not in current_user_result:
                logger.error("Failed to fetch current user status")
                return {}
            user_status = current_user_result["data"].get("userStatus", {})
            if not user_status.get("isSignedIn"):
                logger.warning("User is not signed in")
                return {}
            username = user_status.get("username")
            if not username:
                logger.error("No username found in user status")
                return {}
        query = """
        query ($username: String!) {
            matchedUser(username: $username) {
                username
                profile {
                    realName
                    websites
                    countryName
                    skillTags
                    company
                    school
                    starRating
                    aboutMe
                    userAvatar
                    reputation
                    ranking
                }
            }
        }
        """
        variables = {"username": username}
        result = self._make_graphql_request(query, variables)
        if not result or "data" not in result:
            logger.error(f"Failed to fetch user profile for {username}")
            return {}
        matched_user = result["data"].get("matchedUser", {})
        if not matched_user:
            logger.warning(f"No user found with username: {username}")
            return {}
        profile = matched_user.get("profile", {})
        enhanced_profile = {
            "username": matched_user.get("username"),
            "real_name": profile.get("realName"),
            "websites": profile.get("websites", []),
            "country_name": profile.get("countryName"),
            "skill_tags": profile.get("skillTags", []),
            "company": profile.get("company"),
            "school": profile.get("school"),
            "star_rating": profile.get("starRating"),
            "about_me": profile.get("aboutMe"),
            "user_avatar": profile.get("userAvatar"),
            "reputation": profile.get("reputation"),
            "ranking": profile.get("ranking"),
            "raw_data": {"matched_user": matched_user, "profile": profile},
        }
        logger.info(f"Successfully fetched profile for user: {username}")
        return enhanced_profile

    def get_problem_detail(self, title_slug: str) -> Optional[Dict[str, Any]]:
        """
        Get problem description using GraphQL API.

        Args:
            title_slug: Problem title slug

        Returns:
            Dict with problem information or None if failed
        """
        try:
            # GraphQL query for problem details
            query = """
            query questionData($titleSlug: String!) {
                question(titleSlug: $titleSlug) {
                    questionId
                    title
                    titleSlug
                    content
                    difficulty
                    topicTags {
                        name
                        slug
                    }
                }
            }
            """

            variables = {"titleSlug": title_slug}
            result = self._make_graphql_request(query, variables)

            if not result or "data" not in result:
                logger.error(f"Failed to fetch problem data for {title_slug}")
                return None

            question_data = result["data"].get("question")
            if not question_data:
                logger.warning(f"No question data found for {title_slug}")
                return None

            # Transform to our format
            problem_info = {
                "id": question_data.get("questionId"),
                "title": question_data.get("title"),
                "title_slug": question_data.get("titleSlug"),
                "content": question_data.get("content"),
                "difficulty": question_data.get("difficulty"),
                "topic_tags": [
                    tag.get("name") for tag in question_data.get("topicTags", [])
                ],
            }

            logger.info(f"Successfully fetched problem data for {title_slug}")
            return problem_info

        except Exception as e:
            logger.error(f"Error fetching problem description for {title_slug}: {e}")
            return None

    def test_connection(self) -> bool:
        """Test LeetCode connection by fetching user profile"""
        try:
            profile = self.get_user_profile()
            if profile and profile.get("username"):
                return True
            return False
        except Exception as e:
            logger.error(f"LeetCode GraphQL test_connection failed: {e}")
            return False

    def close(self):
        """Close the session"""
        if self.session:
            self.session.close()
