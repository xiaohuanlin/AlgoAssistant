import json
from unittest.mock import MagicMock, Mock, patch

import pytest

from app.services.leetcode_graphql_service import LeetCodeGraphQLService


class TestLeetCodeGraphQLService:
    """Test cases for LeetCodeGraphQLService."""

    def setup_method(self):
        """Set up test fixtures."""
        self.config = {"username": "testuser", "session_id": "test_session_id"}
        self.service = LeetCodeGraphQLService(self.config)

    def test_init_with_config(self):
        """Test service initialization with config."""
        assert self.service.username == "testuser"
        assert self.service.session_id == "test_session_id"
        assert self.service.base_url == "https://leetcode.com/graphql"

    def test_get_headers(self):
        """Test getting request headers."""
        headers = self.service.get_headers()

        assert "User-Agent" in headers
        assert "Content-Type" in headers
        assert headers["Content-Type"] == "application/json"
        assert "Cookie" in headers
        assert "LEETCODE_SESSION" in headers["Cookie"]

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_execute_query_success(self, mock_post):
        """Test successful GraphQL query execution."""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": {
                "user": {
                    "username": "testuser",
                    "submissionStats": {"acSubmissionNum": [{"count": 10}]},
                }
            }
        }
        mock_post.return_value = mock_response

        query = """
        query getUserProfile($username: String!) {
            user(username: $username) {
                username
                submissionStats {
                    acSubmissionNum {
                        count
                    }
                }
            }
        }
        """
        variables = {"username": "testuser"}

        result = self.service.execute_query(query, variables)

        assert result["data"]["user"]["username"] == "testuser"
        assert (
            result["data"]["user"]["submissionStats"]["acSubmissionNum"][0]["count"]
            == 10
        )

        # Verify request was made correctly
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args[1]["url"] == "https://leetcode.com/graphql"
        assert call_args[1]["headers"]["Content-Type"] == "application/json"

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_execute_query_http_error(self, mock_post):
        """Test GraphQL query execution with HTTP error."""
        # Mock HTTP error response
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        mock_post.return_value = mock_response

        query = "query { user { username } }"

        with pytest.raises(Exception) as exc_info:
            self.service.execute_query(query, {})

        assert "HTTP 401" in str(exc_info.value)

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_execute_query_graphql_error(self, mock_post):
        """Test GraphQL query execution with GraphQL errors."""
        # Mock response with GraphQL errors
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "errors": [
                {"message": "User not found", "locations": [{"line": 1, "column": 10}]}
            ]
        }
        mock_post.return_value = mock_response

        query = "query { user { username } }"

        with pytest.raises(Exception) as exc_info:
            self.service.execute_query(query, {})

        assert "GraphQL errors" in str(exc_info.value)
        assert "User not found" in str(exc_info.value)

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_get_user_submissions_success(self, mock_post):
        """Test getting user submissions successfully."""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": {
                "user": {
                    "submissions": [
                        {
                            "id": 123,
                            "title": "Two Sum",
                            "titleSlug": "two-sum",
                            "statusDisplay": "Accepted",
                            "lang": "python",
                            "code": "def twoSum(nums, target): pass",
                            "timestamp": "1640995200",
                        }
                    ]
                }
            }
        }
        mock_post.return_value = mock_response

        submissions = self.service.get_user_submissions()

        assert len(submissions) == 1
        submission = submissions[0]
        assert submission["id"] == 123
        assert submission["title"] == "Two Sum"
        assert submission["statusDisplay"] == "Accepted"
        assert submission["lang"] == "python"

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_get_user_submissions_empty(self, mock_post):
        """Test getting user submissions when user has no submissions."""
        # Mock empty response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": {"user": {"submissions": []}}}
        mock_post.return_value = mock_response

        submissions = self.service.get_user_submissions()

        assert submissions == []

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_get_user_submissions_error(self, mock_post):
        """Test getting user submissions with error."""
        # Mock error response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"errors": [{"message": "User not found"}]}
        mock_post.return_value = mock_response

        with pytest.raises(Exception):
            self.service.get_user_submissions()

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_get_problem_details_success(self, mock_post):
        """Test getting problem details successfully."""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": {
                "question": {
                    "questionId": "1",
                    "title": "Two Sum",
                    "titleSlug": "two-sum",
                    "difficulty": "Easy",
                    "categoryTitle": "Array",
                    "topicTags": [{"name": "Array"}, {"name": "Hash Table"}],
                    "content": "<p>Given an array of integers...</p>",
                }
            }
        }
        mock_post.return_value = mock_response

        problem = self.service.get_problem_details("two-sum")

        assert problem["questionId"] == "1"
        assert problem["title"] == "Two Sum"
        assert problem["difficulty"] == "Easy"
        assert problem["categoryTitle"] == "Array"
        assert len(problem["topicTags"]) == 2

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_get_problem_details_not_found(self, mock_post):
        """Test getting problem details for non-existent problem."""
        # Mock not found response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": {"question": None}}
        mock_post.return_value = mock_response

        problem = self.service.get_problem_details("non-existent")

        assert problem is None

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_get_user_profile_success(self, mock_post):
        """Test getting user profile successfully."""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": {
                "user": {
                    "username": "testuser",
                    "profile": {
                        "realName": "Test User",
                        "countryName": "United States",
                        "ranking": 1000,
                    },
                    "submissionStats": {
                        "acSubmissionNum": [
                            {"count": 10, "difficulty": "All"},
                            {"count": 5, "difficulty": "Easy"},
                            {"count": 3, "difficulty": "Medium"},
                            {"count": 2, "difficulty": "Hard"},
                        ]
                    },
                }
            }
        }
        mock_post.return_value = mock_response

        profile = self.service.get_user_profile()

        assert profile["username"] == "testuser"
        assert profile["profile"]["realName"] == "Test User"
        assert profile["profile"]["ranking"] == 1000
        assert len(profile["submissionStats"]["acSubmissionNum"]) == 4

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_get_user_profile_error(self, mock_post):
        """Test getting user profile with error."""
        # Mock error response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "errors": [{"message": "Authentication required"}]
        }
        mock_post.return_value = mock_response

        with pytest.raises(Exception):
            self.service.get_user_profile()

    def test_build_submissions_query(self):
        """Test building submissions query."""
        query = self.service.build_submissions_query()

        assert "query" in query
        assert "user" in query
        assert "submissions" in query
        assert "username" in query

    def test_build_problem_query(self):
        """Test building problem details query."""
        query = self.service.build_problem_query()

        assert "query" in query
        assert "question" in query
        assert "titleSlug" in query

    def test_build_profile_query(self):
        """Test building user profile query."""
        query = self.service.build_profile_query()

        assert "query" in query
        assert "user" in query
        assert "profile" in query
        assert "submissionStats" in query

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_rate_limit_handling(self, mock_post):
        """Test handling of rate limiting."""
        # Mock rate limit response
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.text = "Too Many Requests"
        mock_post.return_value = mock_response

        query = "query { user { username } }"

        with pytest.raises(Exception) as exc_info:
            self.service.execute_query(query, {})

        assert "HTTP 429" in str(exc_info.value)

    @patch("app.services.leetcode_graphql_service.requests.post")
    def test_network_error_handling(self, mock_post):
        """Test handling of network errors."""
        # Mock network error
        mock_post.side_effect = Exception("Network error")

        query = "query { user { username } }"

        with pytest.raises(Exception) as exc_info:
            self.service.execute_query(query, {})

        assert "Network error" in str(exc_info.value)

    def test_validate_config(self):
        """Test configuration validation."""
        # Test valid config
        valid_config = {"username": "testuser", "session_id": "test_session"}
        service = LeetCodeGraphQLService(valid_config)
        assert service.username == "testuser"

        # Test missing username
        invalid_config = {"session_id": "test_session"}
        with pytest.raises(ValueError):
            LeetCodeGraphQLService(invalid_config)

        # Test missing session_id
        invalid_config = {"username": "testuser"}
        with pytest.raises(ValueError):
            LeetCodeGraphQLService(invalid_config)
