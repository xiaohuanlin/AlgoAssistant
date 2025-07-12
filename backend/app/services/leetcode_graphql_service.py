"""
LeetCode GraphQL Service
Uses GraphQL API to fetch LeetCode data without browser simulation
Based on leetcode-query implementation
"""

import requests
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import time
import re
import random

from app.utils.logger import get_logger
from app.utils.retry import retry, GRAPHQL_RETRY_CONFIG, RetryableOperation

logger = get_logger(__name__)

class LeetCodeGraphQLService:
    """LeetCode service using GraphQL API for data fetching"""
    
    def __init__(self, session_cookie: str):
        if not session_cookie:
            raise ValueError("LeetCode session cookie is required and cannot be empty")
        
        self.session_cookie = session_cookie
        self.session = requests.Session()
        self.base_url = "https://leetcode.com"
        self.graphql_url = f"{self.base_url}/graphql"
        
        # Set up more realistic session headers
        self.session.headers.update({
            'content-type': 'application/json',
            'origin': self.base_url,
            'referer': self.base_url,
            'user-agent': 'Mozilla/5.0 LeetCode API',
        })
        
        # Set session cookie
        self.session.cookies.set('LEETCODE_SESSION', session_cookie, domain='.leetcode.com')
        
        # Initialize retry operation
        self.retry_operation = RetryableOperation(GRAPHQL_RETRY_CONFIG)
    
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

    @retry(max_retries=3, base_delay=2.0, max_delay=30.0, exponential_base=2.0, jitter=True)
    def _get_csrf_token(self) -> Optional[str]:
        logger.info("Getting CSRF token from GraphQL endpoint...")
        logger.info(f"GraphQL URL: {self.graphql_url}")
        response = self.session.get(
            self.graphql_url,
            timeout=30,
            allow_redirects=True
        )
        set_cookie = response.headers.get('set-cookie')
        if set_cookie:
            logger.info(f"Found Set-Cookie header: {set_cookie}")
            parsed_cookies = self._parse_cookie(set_cookie)
            logger.info(f"Parsed cookies: {parsed_cookies}")
            if 'csrftoken' in parsed_cookies:
                csrf_token = parsed_cookies['csrftoken']
                logger.info("Successfully obtained CSRF token from Set-Cookie header")
                logger.info(f"CSRF token: {csrf_token[:10]}...")
                return csrf_token
        return None

    def _initialize_session(self) -> bool:
        # Get CSRF token with retry
        csrf_token = self._get_csrf_token()
        if not csrf_token:
            logger.error("Failed to get CSRF token")
            return False
        self.session.cookies.set('csrftoken', csrf_token, domain='.leetcode.com')
        self.session.headers.update({
            'x-csrftoken': csrf_token,
        })
        logger.info("Session initialized successfully")
        return True

    @retry(max_retries=3, base_delay=2.0, max_delay=60.0, exponential_base=2.0, jitter=True)
    def _make_graphql_request(self, query: str, variables: Dict[str, Any] = None) -> Dict[str, Any]:
        # Add random delay to simulate human behavior
        time.sleep(random.uniform(0.5, 2))
        payload = {
            'query': query,
            'variables': variables or {}
        }
        response = self.session.post(
            self.graphql_url,
            json=payload,
            timeout=30
        )
        logger.debug(f"GraphQL response status: {response.status_code}")
        logger.debug(f"GraphQL response headers: {dict(response.headers)}")
        logger.debug(f"GraphQL response URL: {response.url}")
        if response.headers.get('set-cookie'):
            parsed_cookies = self._parse_cookie(response.headers.get('set-cookie'))
            if 'csrftoken' in parsed_cookies:
                self.session.cookies.set('csrftoken', parsed_cookies['csrftoken'], domain='.leetcode.com')
                self.session.headers.update({
                    'x-csrftoken': parsed_cookies['csrftoken'],
                })
        result = response.json()
        logger.debug(f"GraphQL response data: {result}")
        return result

    def get_user_submissions(self, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
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
        variables = {
            'offset': offset,
            'limit': limit,
            'slug': None
        }
        result = self._make_graphql_request(query, variables)
        if not result or 'data' not in result:
            logger.error("Failed to fetch submissions")
            return []
        submission_list = result['data'].get('submissionList', {})
        submissions = submission_list.get('submissions', [])
        # Transform submissions to our format
        transformed_submissions = []
        seen_submission_ids = set()
        for sub in submissions:
            logger.info(f"Processing submission: {sub}")
            submission_id = int(sub.get('id', 0))
            timestamp = int(sub.get('timestamp', 0)) * 1000
            status = sub.get('statusDisplay', 'Unknown')
            is_pending = sub.get('isPending', 'Not Pending') != 'Not Pending'
            runtime = sub.get('runtime', 'Unknown')
            memory = sub.get('memory', 'Unknown')
            title = sub.get('title', 'Unknown')
            lang = sub.get('lang', 'Unknown')
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
                "status": status,
                "sync_status": "pending",
                "language": lang,
                "runtime": runtime,
                "memory": memory,
                "submit_time": submit_time,
                "submission_url": submission_url,
                "submission_id": submission_id,
                "code": '',  # Will be fetched separately
                "topic_tags": [],  # No longer fetching topic tags
                "is_pending": is_pending
            }
            transformed_submissions.append(transformed_submission)
        logger.info(f"Fetched {len(transformed_submissions)} submissions")
        return transformed_submissions

    def get_all_user_submissions(self, max_submissions: int = None, batch_size: int = 20):
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
            time.sleep(random.uniform(1, 2))

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
        variables = {
            'id': submission_id
        }
        result = self._make_graphql_request(query, variables)
        if not result or 'data' not in result:
            logger.error(f"Failed to fetch submission details for ID {submission_id}")
            return None
        logger.info(f"Submission details: {result}")
        submission_details = result['data'].get('submissionDetails', {})
        if not submission_details:
            logger.warning(f"No details found for submission {submission_id}")
            return None
        topic_tags_info = submission_details.get('topicTags', [])
        topic_tags = []
        for topic_tag in topic_tags_info:
            topic_tags.append(topic_tag.get('name', ''))
        code = submission_details.get('code', '')
        runtime_percentile = submission_details.get('runtimePercentile')
        memory_percentile = submission_details.get('memoryPercentile')
        question_id = submission_details.get('question', {}).get('questionId', '')
        total_correct = submission_details.get('totalCorrect', 0)
        total_testcases = submission_details.get('totalTestcases', 0)
        runtime_error = submission_details.get('runtimeError')
        compile_error = submission_details.get('compileError')
        code_output = submission_details.get('codeOutput', '')
        expected_output = submission_details.get('expectedOutput', '')
        success_rate = (total_correct / total_testcases * 100) if total_testcases > 0 else 0
        enhanced_details = {
            'id': submission_details.get('id'),
            'code': code,
            'topic_tags': topic_tags,
            'runtime_percentile': runtime_percentile,
            'memory_percentile': memory_percentile,
            'question_id': question_id,
            'total_correct': total_correct,
            'total_testcases': total_testcases,
            'success_rate': round(success_rate, 2),
            'runtime_error': runtime_error,
            'compile_error': compile_error,
            'code_output': code_output,
            'expected_output': expected_output,
        }
        logger.info(f"Successfully fetched enhanced details for submission {submission_id}")
        logger.info(f"Test cases: {total_correct}/{total_testcases} ({success_rate}% success rate)")
        return enhanced_details

    def get_user_profile(self, username: str = None) -> Dict[str, Any]:
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
            if not current_user_result or 'data' not in current_user_result:
                logger.error("Failed to fetch current user status")
                return None
            user_status = current_user_result['data'].get('userStatus', {})
            if not user_status.get('isSignedIn'):
                logger.warning("User is not signed in")
                return None
            username = user_status.get('username')
            if not username:
                logger.error("No username found in user status")
                return None
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
        variables = {
            'username': username
        }
        result = self._make_graphql_request(query, variables)
        if not result or 'data' not in result:
            logger.error(f"Failed to fetch user profile for {username}")
            return None
        matched_user = result['data'].get('matchedUser', {})
        if not matched_user:
            logger.warning(f"No user found with username: {username}")
            return None
        profile = matched_user.get('profile', {})
        enhanced_profile = {
            'username': matched_user.get('username'),
            'real_name': profile.get('realName'),
            'websites': profile.get('websites', []),
            'country_name': profile.get('countryName'),
            'skill_tags': profile.get('skillTags', []),
            'company': profile.get('company'),
            'school': profile.get('school'),
            'star_rating': profile.get('starRating'),
            'about_me': profile.get('aboutMe'),
            'user_avatar': profile.get('userAvatar'),
            'reputation': profile.get('reputation'),
            'ranking': profile.get('ranking'),
            'raw_data': {
                'matched_user': matched_user,
                'profile': profile
            }
        }
        logger.info(f"Successfully fetched profile for user: {username}")
        logger.info(f"Real name: {enhanced_profile.get('real_name', 'N/A')}")
        logger.info(f"Company: {enhanced_profile.get('company', 'N/A')}")
        logger.info(f"School: {enhanced_profile.get('school', 'N/A')}")
        logger.info(f"Reputation: {enhanced_profile.get('reputation', 'N/A')}")
        logger.info(f"Ranking: {enhanced_profile.get('ranking', 'N/A')}")
        return enhanced_profile
    
    def close(self):
        """Close the session"""
        if self.session:
            self.session.close()
    
    # Sync wrapper methods for compatibility
    def get_user_submissions_sync(self, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """Sync wrapper for get_user_submissions"""
        return self.get_user_submissions(limit, offset)
    
    def get_all_user_submissions_sync(self, max_submissions: int = None) -> List[Dict[str, Any]]:
        """Sync wrapper for get_all_user_submissions"""
        return self.get_all_user_submissions(max_submissions)
    
    def get_submission_details_sync(self, submission_id: int) -> Dict[str, Any]:
        """Sync wrapper for get_submission_details"""
        return self.get_submission_details(submission_id)
    
    def get_user_profile_sync(self, username: str = None) -> Dict[str, Any]:
        """Sync wrapper for get_user_profile"""
        return self.get_user_profile(username)
    
    def fetch_user_submissions_with_cookie(self, session_cookie: str, max_submissions: int = None) -> List[Dict[str, Any]]:
        """Fetch user submissions with session cookie"""
        self.session.cookies.set('LEETCODE_SESSION', session_cookie, domain='.leetcode.com')
        return self.get_all_user_submissions(max_submissions=max_submissions) 