import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, List

from app.schemas.notification import EmailSettings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class EmailService:
    """Service for sending email notifications."""

    def __init__(self, smtp_settings: EmailSettings | None):
        self.smtp_settings = smtp_settings

    def send_review_reminder(
        self,
        to_email: str,
        user_name: str,
        reviews_data: List[Dict],
    ) -> bool:
        """Send review reminder email to user.

        Args:
            to_email: Recipient email address
            user_name: User's display name
            reviews_data: List of review data dictionaries
        """
        try:
            if not to_email:
                logger.warning("No email address provided")
                return False

            # Create email content
            subject = f"Review Reminder - {len(reviews_data)} problems need review"
            content = self._create_email_content(user_name, reviews_data)

            # Send email
            success = self._send_email(
                to_email=to_email,
                subject=subject,
                content=content,
            )

            if success:
                logger.info(f"Review reminder email sent to {to_email}")

            return success

        except Exception as e:
            logger.exception(f"Failed to send review reminder email to {to_email}: {e}")
            return False

    def _create_email_content(self, user_name: str, reviews_data: List[Dict]) -> str:
        """Create email content for review reminder.

        Args:
            user_name: User's display name
            reviews_data: List of review data dictionaries with keys:
                - problem_title: Problem title
                - execution_result: Execution result (e.g., "Wrong Answer")
                - language: Programming language
                - wrong_reason: Why the problem was wrong
                - review_plan: Review plan
                - review_id: Review ID for the link
        """
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .header {{ background-color: #f8f9fa; padding: 20px; border-radius: 5px; }}
                .review-item {{
                    background-color: #fff;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 10px 0;
                }}
                .problem-title {{ font-weight: bold; color: #007bff; }}
                .execution-result {{
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 12px;
                    font-weight: bold;
                }}
                .wrong-answer {{ background-color: #f8d7da; color: #721c24; }}
                .time-limit {{ background-color: #fff3cd; color: #856404; }}
                .memory-limit {{ background-color: #d1ecf1; color: #0c5460; }}
                .button {{
                    display: inline-block;
                    background-color: #007bff;
                    color: white;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 10px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Review Reminder</h2>
                <p>Hello {user_name},</p>
                <p>You have <strong>{len(reviews_data)}</strong> problems that need review:</p>
            </div>
        """

        for review_data in reviews_data:
            # Determine result class
            result_class = "wrong-answer"
            execution_result = review_data.get("execution_result", "")
            if "Time Limit" in execution_result:
                result_class = "time-limit"
            elif "Memory Limit" in execution_result:
                result_class = "memory-limit"

            html_content += f"""
            <div class="review-item">
                <div class="problem-title">{review_data.get('problem_title', 'Unknown Problem')}</div>
                <div>
                    <span class="execution-result {result_class}">{execution_result}</span>
                    <span style="margin-left: 10px; color: #666;">{review_data.get('language', 'Unknown')}</span>
                </div>
                <div style="margin-top: 10px; color: #666;">
                    <strong>Wrong Reason:</strong> {review_data.get('wrong_reason', 'Not specified')}
                </div>
                <div style="margin-top: 5px; color: #666;">
                    <strong>Review Plan:</strong> {review_data.get('review_plan', 'Not specified')}
                </div>
                <div style="margin-top: 10px;">
                    <a href="/review/{review_data.get('review_id', '')}" class="button">Start Review</a>
                </div>
            </div>
            """

        html_content += """
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p>Keep up the great work!</p>
                <p>AlgoAssistant</p>
            </div>
        </body>
        </html>
        """

        return html_content

    def _send_email(self, to_email: str, subject: str, content: str) -> bool:
        """Send email using SMTP."""
        try:
            # Default SMTP settings
            smtp_server = self.smtp_settings.smtp_server
            smtp_port = self.smtp_settings.smtp_port
            from_email = self.smtp_settings.email
            password = self.smtp_settings.password

            if not password:
                logger.error("SMTP password not configured")
                return False

            # Clean password of any non-ASCII characters (like non-breaking spaces)
            password = "".join(char for char in password if ord(char) < 128)

            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = from_email
            msg["To"] = to_email

            # Add HTML content
            html_part = MIMEText(content, "html")
            msg.attach(html_part)

            # Send email - handle both SSL (465) and TLS (587) ports
            if smtp_port == 465:
                # Use SSL connection for port 465
                with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
                    server.login(from_email, password)
                    server.send_message(msg)
            else:
                # Use TLS connection for port 587 and others
                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    server.starttls()
                    server.login(from_email, password)
                    server.send_message(msg)

            return True

        except Exception as e:
            logger.exception(f"Failed to send email to {to_email}: {e}")
            return False
