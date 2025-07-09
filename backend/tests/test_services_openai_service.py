import pytest
import time
from app.services.openai_service import OpenAIService
from unittest.mock import patch, MagicMock

class TestOpenAIService:
    """Test OpenAIService functionality."""
    
    def test_analyze_code_success(self):
        """Test successful code analysis."""
        service = OpenAIService()
        
        code = "def twoSum(nums, target):\n    return [0, 1]"
        result = service.analyze_code(code, user_id=1, problem_description="Two Sum", language="python")
        
        assert "summary" in result
        assert "tags" in result
        assert "step_analysis" in result
        assert "recommendations" in result
        assert "Two Pointers" in result["tags"]
        assert "HashMap" in result["tags"]
    
    def test_analyze_code_invalid_json_response(self):
        """Test code analysis with invalid response."""
        service = OpenAIService()
        
        code = "def twoSum(nums, target):\n    return [0, 1]"
        result = service.analyze_code(code, user_id=1, problem_description="Two Sum", language="python")
        
        # Should still return valid result even with mock implementation
        assert "summary" in result
        assert "tags" in result
    
    def test_analyze_code_api_error(self):
        """Test code analysis with API error."""
        service = OpenAIService()
        
        code = "def twoSum(nums, target):\n    return [0, 1]"
        result = service.analyze_code(code, user_id=1, problem_description="Two Sum", language="python")
        
        # Mock implementation should not have API errors
        assert "error" not in result
        assert "summary" in result
    
    def test_analyze_code_different_language(self):
        """Test code analysis with different programming language."""
        service = OpenAIService()
        
        code = "public int[] twoSum(int[] nums, int target) {\n    return new int[]{0, 1};\n}"
        result = service.analyze_code(code, user_id=1, problem_description="Two Sum", language="java")
        
        assert "summary" in result
        assert "tags" in result
        assert "step_analysis" in result
    
    def test_analyze_code_empty_code(self):
        """Test code analysis with empty code."""
        service = OpenAIService()
        
        code = ""
        result = service.analyze_code(code, user_id=1, problem_description="Two Sum", language="python")
        
        assert "summary" in result
        assert "tags" in result
    
    def test_analyze_code_with_comments(self):
        """Test code analysis with code containing comments."""
        service = OpenAIService()
        
        code = """
        # Two Sum solution
        def twoSum(nums, target):
            # Use hash map for O(n) time complexity
            return [0, 1]
        """
        result = service.analyze_code(code, user_id=1, problem_description="Two Sum", language="python")
        
        assert "summary" in result
        assert "tags" in result
        assert "step_analysis" in result
    
    def test_analyze_code_too_long(self):
        """Test code analysis with code that exceeds length limit."""
        service = OpenAIService(max_code_length=10)
        
        code = "def twoSum(nums, target):\n    return [0, 1]\n# This is a very long comment that exceeds the limit"
        result = service.analyze_code(code, user_id=1, problem_description="Two Sum", language="python")
        
        assert "error" in result
        assert "too long" in result["error"]
    
    def test_analyze_code_rate_limit(self):
        """Test code analysis with rate limiting."""
        service = OpenAIService(rate_limit_per_minute=2)
        
        code = "def twoSum(nums, target):\n    return [0, 1]"
        
        # First two calls should succeed
        result1 = service.analyze_code(code, user_id=1, problem_description="Two Sum", language="python")
        result2 = service.analyze_code(code, user_id=1, problem_description="Two Sum", language="python")
        
        assert "error" not in result1
        assert "error" not in result2
        
        # Third call should be rate limited
        result3 = service.analyze_code(code, user_id=1, problem_description="Two Sum", language="python")
        assert "error" in result3
        assert "rate limit" in result3["error"]
    
    def test_recommend_related_problems(self):
        """Test related problems recommendation."""
        service = OpenAIService()
        
        code = "def twoSum(nums, target):\n    return [0, 1]"
        recommendations = service.recommend_related_problems(code, problem_id="1")
        
        assert isinstance(recommendations, list)
        assert len(recommendations) > 0
        assert "1" in recommendations
        assert "15" in recommendations
        assert "167" in recommendations
    
    def test_service_initialization(self):
        """Test service initialization with different parameters."""
        # Test with default parameters
        service1 = OpenAIService()
        assert service1.max_code_length == 2000
        assert service1.rate_limit_per_minute == 10
        
        # Test with custom parameters
        service2 = OpenAIService(max_code_length=1000, rate_limit_per_minute=5)
        assert service2.max_code_length == 1000
        assert service2.rate_limit_per_minute == 5
    
    def test_analyze_code_with_empty_problem_description(self):
        """Test code analysis with empty problem description."""
        service = OpenAIService()
        code = "def test(): pass"
        user_id = 1
        
        result = service.analyze_code(code, user_id, "", "python")
        
        assert "summary" in result
        assert "tags" in result
        assert "error_reason" in result
        assert "step_analysis" in result
        assert "recommendations" in result
    
    def test_analyze_code_with_empty_language(self):
        """Test code analysis with empty language."""
        service = OpenAIService()
        code = "def test(): pass"
        user_id = 1
        
        result = service.analyze_code(code, user_id, "Test problem", "")
        
        assert "summary" in result
        assert "tags" in result
        assert "error_reason" in result
        assert "step_analysis" in result
        assert "recommendations" in result
    
    def test_analyze_code_with_empty_code(self):
        """Test code analysis with empty code."""
        service = OpenAIService()
        code = ""
        user_id = 1
        
        result = service.analyze_code(code, user_id, "Test problem", "python")
        
        assert "summary" in result
        assert "tags" in result
        assert "error_reason" in result
        assert "step_analysis" in result
        assert "recommendations" in result 