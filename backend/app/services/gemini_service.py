import json
from typing import Any, Dict, List

from google import genai

from app.schemas.gemini import GeminiAIAnalysisSchema, GeminiConfig
from app.services.base_ai_service import BaseAIService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class GeminiService(BaseAIService[GeminiConfig]):
    """Service class for code analysis using Google's Gemini model via python-genai."""

    def __init__(self, config: GeminiConfig):
        """Initialize the Gemini service with configuration."""
        super().__init__(config)
        self.config = config

        # Initialize Gemini client
        self.client = genai.Client(api_key=config.api_key)

    def test_connection(self) -> bool:
        """Test connection to Gemini API."""
        try:
            # Simple test prompt
            response = self.client.models.generate_content(
                model=self.config.model_name, contents="Hello"
            )
            return response.text is not None
        except Exception as e:
            logger.error(f"Gemini connection test failed: {e}")
            return False

    def _create_analysis_prompt(
        self, code: str, problem_description: str, language: str
    ) -> str:
        """Create a structured prompt for code analysis.

        Args:
            code: The source code to analyze
            problem_description: Description of the problem being solved
            language: Programming language of the code

        Returns:
            A formatted prompt string for the Gemini model
        """
        return f"""Analyze the following code solution for the problem:

Problem Description:
{problem_description}

Code:
```{language}
{code}
```

Provide a detailed analysis including:
- summary: Brief overview of the solution's approach
- solution_types: list of types of the solution, e.g., DFS, DP, Greedy, etc.
- time_complexity: Time complexity in Big-O notation, e.g., O(n log n)
- space_complexity: Space complexity in Big-O notation
- algorithm_type: Main algorithm category, e.g., DFS, DP
- code_quality_score: Overall code quality rating (1-10), 10 is the best
- style_score: Code readability and formatting rating (1-10), 10 is the best
- correctness_confidence: Estimated correctness confidence (0.0 - 1.0), 1.0 is the best
- step_analysis: Step-by-step breakdown of the code logic, each step should be a string
- improvement_suggestions: Suggestions for improvement or optimization
- edge_cases_covered: Mentioned edge cases handled in the solution
- related_problems: List of similar problems or variants, each problem should be a link to the problem, e.g. https://leetcode.com/problems/problem-name/
- risk_areas: Parts of the code that may be error-prone or complex
- learning_points: Takeaways or lessons from this solution

Format the response as a structured JSON with these exact keys:
- summary: string
- solution_types: list[string]
- time_complexity: string
- space_complexity: string
- algorithm_type: string
- code_quality_score: int
- style_score: int
- correctness_confidence: float
- step_analysis: list[string]
- improvement_suggestions: string
- edge_cases_covered: list[string]
- related_problems: list[string]
- risk_areas: list[string]
- learning_points: list[string]

Return only the JSON object, no additional text."""

    def analyze_code(
        self, code: str, problem_description: str = "", language: str = "python"
    ) -> tuple[bool, dict[str, Any]]:
        """Analyze code using Gemini model.

        Args:
            code: Source code to analyze
            problem_description: Optional problem description
            language: Programming language of the code

        Returns:
            Dictionary containing analysis results

        Raises:
            Exception: If analysis fails
        """
        try:
            # Create analysis prompt
            prompt = self._create_analysis_prompt(code, problem_description, language)

            # Get response from Gemini
            response = self.client.models.generate_content(
                model=self.config.model_name, contents=prompt
            )

            if not response.text:
                raise Exception("No response from Gemini model")

            # Parse JSON response
            try:
                analysis_result = json.loads(response.text)
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract JSON from the response
                import re

                json_match = re.search(r"{.*\}", response.text, re.DOTALL)
                if json_match:
                    analysis_result = json.loads(json_match.group())
                else:
                    raise Exception("Failed to parse JSON response from Gemini")

            # Add metadata
            analysis_result["model_version"] = self.config.model_name

            try:
                validated_result = GeminiAIAnalysisSchema(**analysis_result)
            except Exception as e:
                logger.error(
                    f"GeminiAIAnalysisSchema validation failed: {e}, data: {analysis_result}"
                )
                return False, {"error": f"schema validation failed: {e}"}
            return True, validated_result.model_dump()

        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return False, {"error": str(e)}
