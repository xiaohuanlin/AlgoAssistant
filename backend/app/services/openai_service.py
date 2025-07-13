import time
from collections import defaultdict
from typing import Any, Dict, List

from app.services.base_ai_service import BaseAIService


class OpenAIService(BaseAIService):
    """OpenAI-based AI analysis service implementation with configurable length and per-user rate limiting."""

    def __init__(self, max_code_length=2000, rate_limit_per_minute=10):
        self.max_code_length = max_code_length
        self.rate_limit_per_minute = rate_limit_per_minute
        self._user_call_times = defaultdict(list)  # user_id -> [timestamp, ...]

    def analyze_code(
        self, code: str, user_id: int, problem_description: str = "", language: str = ""
    ) -> Dict[str, Any]:
        """Analyze code and return summary, tags, error analysis, etc. (mock implementation)"""
        # Content length check
        if len(code) > self.max_code_length:
            return {
                "error": f"Code too long for AI analysis (max {self.max_code_length})."
            }
        # Per-user rate limit
        now = time.time()
        times = self._user_call_times[user_id]
        times = [t for t in times if now - t < 60]  # keep only last 60s
        if len(times) >= self.rate_limit_per_minute:
            return {
                "error": f"AI analysis rate limit exceeded ({self.rate_limit_per_minute}/min)."
            }
        times.append(now)
        self._user_call_times[user_id] = times
        # Mock AI result
        return {
            "summary": "This is a mock summary of the solution.",
            "tags": ["Two Pointers", "HashMap"],
            "error_reason": None,
            "step_analysis": [
                "Step 1: Initialize pointers.",
                "Step 2: Traverse the array.",
                "Step 3: Return the result.",
            ],
            "recommendations": ["1", "15", "167"],
        }

    def recommend_related_problems(
        self, code: str, problem_number: str = ""
    ) -> List[str]:
        """Recommend related problems based on code and problem context (mock)."""
        return ["1", "15", "167"]
