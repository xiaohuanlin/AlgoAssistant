from typing import Dict, List, Tuple

from notion_client import Client
from notion_client.errors import APIResponseError

from app.models import Record
from app.schemas.notion import NotionConfig
from app.services.base_note_service import BaseNoteService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class NotionService(BaseNoteService[NotionConfig]):
    """Notion integration service: only create page from record."""

    def __init__(self, config: NotionConfig):
        super().__init__(config)
        assert config.token is not None, "Notion token is required"
        assert config.db_id is not None, "Notion database_id is required"
        self.client = Client(auth=config.token)
        self.db_id = config.db_id

    def _split_text(self, text: str, max_length: int = 2000) -> List[str]:
        """Split long text into chunks of max_length to avoid Notion API length limit errors."""
        if not text:
            return [""]
        return [text[i : i + max_length] for i in range(0, len(text), max_length)]

    def _map_language_to_notion(self, language: str) -> str:
        """Map programming language variants to Notion-supported language identifiers."""
        language_mapping = {
            # Python variants
            "python3": "python",
            "python2": "python",
            "py": "python",
            # JavaScript variants
            "javascript": "javascript",
            "js": "javascript",
            "node": "javascript",
            # TypeScript
            "typescript": "typescript",
            "ts": "typescript",
            # Java variants
            "java": "java",
            "jdk": "java",
            # C++ variants
            "cpp": "c++",
            "c++": "c++",
            "cxx": "c++",
            # C variants
            "c": "c",
            "gcc": "c",
            # C# variants
            "csharp": "c#",
            "c#": "c#",
            "dotnet": "c#",
            # Go
            "golang": "go",
            "go": "go",
            # Rust
            "rust": "rust",
            "rs": "rust",
            # Ruby
            "ruby": "ruby",
            "rb": "ruby",
            # PHP
            "php": "php",
            # Swift
            "swift": "swift",
            # Kotlin
            "kotlin": "kotlin",
            "kt": "kotlin",
            # Scala
            "scala": "scala",
            "sc": "scala",
            # Other common languages
            "bash": "bash",
            "shell": "shell",
            "sh": "shell",
            "sql": "sql",
            "html": "html",
            "css": "css",
            "json": "json",
            "yaml": "yaml",
            "yml": "yaml",
            "xml": "xml",
            "markdown": "markdown",
            "md": "markdown",
        }

        # Convert to lowercase and strip whitespace
        normalized_language = language.lower().strip()

        # Return mapped language or default to "plain text"
        return language_mapping.get(normalized_language, "plain text")

    def test_connection(self) -> bool:
        """Test Notion API connection."""
        try:
            self.client.pages.retrieve(page_id=self.db_id)
            return True
        except Exception as e:
            logger.error(f"Notion connection test failed: {e}")
            return False

    def create_page_from_record(self, record: Record) -> Tuple[bool, Dict[str, str]]:
        """Create a Notion page from a record, strictly following Notion API property/children format."""
        try:
            problem_content_blocks = [
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": chunk}}]
                    },
                }
                for i, chunk in enumerate(
                    self._split_text(record.problem.content, 2000)
                )
            ]

            code_blocks = [
                {
                    "object": "block",
                    "type": "code",
                    "code": {
                        "rich_text": [{"type": "text", "text": {"content": chunk}}],
                        "language": self._map_language_to_notion(record.language),
                    },
                }
                for i, chunk in enumerate(self._split_text(record.code, 2000))
            ]

            # AI Analysis blocks
            ai_analysis_blocks = []
            if record.ai_analysis:
                ai_analysis = record.ai_analysis

                # Summary
                if ai_analysis.get("summary"):
                    ai_analysis_blocks.extend(
                        [
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {
                                                "content": "📊 AI Analysis Summary"
                                            },
                                        }
                                    ]
                                },
                            },
                            {
                                "object": "block",
                                "type": "paragraph",
                                "paragraph": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": ai_analysis["summary"]},
                                        }
                                    ]
                                },
                            },
                        ]
                    )

                # Complexity Analysis
                if ai_analysis.get("time_complexity") or ai_analysis.get(
                    "space_complexity"
                ):
                    complexity_text = f"Time Complexity: {ai_analysis.get('time_complexity', 'N/A')}\nSpace Complexity: {ai_analysis.get('space_complexity', 'N/A')}"
                    ai_analysis_blocks.extend(
                        [
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {
                                                "content": "⚡ Complexity Analysis"
                                            },
                                        }
                                    ]
                                },
                            },
                            {
                                "object": "block",
                                "type": "code",
                                "code": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": complexity_text},
                                        }
                                    ],
                                    "language": "plain text",
                                },
                            },
                        ]
                    )

                # Algorithm Type
                if ai_analysis.get("algorithm_type"):
                    ai_analysis_blocks.extend(
                        [
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": "🎯 Algorithm Type"},
                                        }
                                    ]
                                },
                            },
                            {
                                "object": "block",
                                "type": "paragraph",
                                "paragraph": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {
                                                "content": ai_analysis["algorithm_type"]
                                            },
                                        }
                                    ]
                                },
                            },
                        ]
                    )

                # Code Quality Score
                if ai_analysis.get("code_quality_score"):
                    ai_analysis_blocks.extend(
                        [
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": "⭐ Code Quality Score"},
                                        }
                                    ]
                                },
                            },
                            {
                                "object": "block",
                                "type": "paragraph",
                                "paragraph": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {
                                                "content": f"{ai_analysis['code_quality_score']}/10"
                                            },
                                        }
                                    ]
                                },
                            },
                        ]
                    )

                # Step Analysis
                if ai_analysis.get("step_analysis"):
                    step_analysis_text = "\n".join(
                        [f"• {step}" for step in ai_analysis["step_analysis"]]
                    )
                    ai_analysis_blocks.extend(
                        [
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {
                                                "content": "🔍 Step-by-Step Analysis"
                                            },
                                        }
                                    ]
                                },
                            },
                            {
                                "object": "block",
                                "type": "bulleted_list_item",
                                "bulleted_list_item": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": step_analysis_text},
                                        }
                                    ]
                                },
                            },
                        ]
                    )

                # Improvement Suggestions
                if ai_analysis.get("improvement_suggestions"):
                    improvement_text = (
                        ai_analysis["improvement_suggestions"]
                        if isinstance(ai_analysis["improvement_suggestions"], str)
                        else "\n".join(ai_analysis["improvement_suggestions"])
                    )
                    ai_analysis_blocks.extend(
                        [
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {
                                                "content": "💡 Improvement Suggestions"
                                            },
                                        }
                                    ]
                                },
                            },
                            {
                                "object": "block",
                                "type": "paragraph",
                                "paragraph": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": improvement_text},
                                        }
                                    ]
                                },
                            },
                        ]
                    )

                # Learning Points
                if ai_analysis.get("learning_points"):
                    learning_points_text = "\n".join(
                        [f"• {point}" for point in ai_analysis["learning_points"]]
                    )
                    ai_analysis_blocks.extend(
                        [
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": "🎓 Learning Points"},
                                        }
                                    ]
                                },
                            },
                            {
                                "object": "block",
                                "type": "bulleted_list_item",
                                "bulleted_list_item": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": learning_points_text},
                                        }
                                    ]
                                },
                            },
                        ]
                    )

                # Related Problems
                if ai_analysis.get("related_problems"):
                    related_problems_text = ", ".join(ai_analysis["related_problems"])
                    ai_analysis_blocks.extend(
                        [
                            {
                                "object": "block",
                                "type": "heading_3",
                                "heading_3": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": "🔗 Related Problems"},
                                        }
                                    ]
                                },
                            },
                            {
                                "object": "block",
                                "type": "paragraph",
                                "paragraph": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": related_problems_text},
                                        }
                                    ]
                                },
                            },
                        ]
                    )

            children = [
                {
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": "📝 Problem Description"},
                            }
                        ],
                        "color": "default",
                        "is_toggleable": False,
                    },
                },
                *problem_content_blocks,
                {
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": "💻 Code Implementation"},
                            }
                        ],
                        "color": "default",
                        "is_toggleable": False,
                    },
                },
                *code_blocks,
            ]

            # Add AI Analysis section if available
            if ai_analysis_blocks:
                children.extend(
                    [
                        {
                            "object": "block",
                            "type": "heading_2",
                            "heading_2": {
                                "rich_text": [
                                    {
                                        "type": "text",
                                        "text": {"content": "🤖 AI Analysis"},
                                    }
                                ],
                                "color": "default",
                                "is_toggleable": False,
                            },
                        },
                        *ai_analysis_blocks,
                    ]
                )

            children.extend(
                [
                    {
                        "object": "block",
                        "type": "heading_2",
                        "heading_2": {
                            "rich_text": [
                                {
                                    "type": "text",
                                    "text": {"content": "🔗 Submission Link"},
                                }
                            ],
                            "color": "default",
                            "is_toggleable": False,
                        },
                    },
                    {
                        "object": "block",
                        "type": "bookmark",
                        "bookmark": {"url": getattr(record, "submission_url", "")},
                    },
                ]
            )

            response = self.client.pages.create(
                parent={"page_id": self.db_id},
                properties={
                    "title": [
                        {"type": "text", "text": {"content": record.problem.title}}
                    ]
                },
                children=children,
            )
            return True, {"page_id": response["id"], "page_url": response["url"]}
        except APIResponseError as e:
            logger.error(f"Notion API error: {e}", exc_info=True)
            return False, {"error": f"Notion API error: {e}"}
        except Exception as e:
            logger.error(f"Failed to create Notion page: {e}", exc_info=True)
            return False, {"error": f"Create page failed: {e}"}
