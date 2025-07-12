import os
import sys
import time
import redis
import asyncio
import random
import inspect

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker
from app.database import engine
from app.models import Record, User, UserConfig
from app.services.leetcode_graphql_service import LeetCodeGraphQLService
from app.utils.logger import get_logger
from app.utils.rate_limiter import get_global_rate_limiter

logger = get_logger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
QUEUE_NAME = "leetcode_sync_queue"
USER_RATE_LIMIT_DELAY = float(os.getenv("USER_RATE_LIMIT_DELAY", "2.0"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
BATCH_SIZE = int(os.getenv("CONSUMER_BATCH_SIZE", "10"))  # Process multiple records in batch
DB_CONNECTION_TIMEOUT = int(os.getenv("DB_CONNECTION_TIMEOUT", "300"))  # 5 minutes

# Rate limit configuration for this consumer
SUBMISSION_FETCH_RATE_LIMIT = {
    "max_requests": 5,  # 5 requests
    "window_seconds": 5,  # per minute
    "operation": "submission_fetch"
}

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class LeetCodeConsumer:
    def __init__(self):
        self.graphql_service = None
        self.last_processed_user = None
        self.redis_client = redis.Redis.from_url(REDIS_URL)
        self.rate_limiter = get_global_rate_limiter(self.redis_client)
        self.db = None
        self.db_start_time = None
        
    def _get_db_session(self):
        """Get or create database session with timeout management"""
        current_time = time.time()
        
        # Create new session if none exists or if timeout exceeded
        if (self.db is None or 
            self.db_start_time is None or 
            current_time - self.db_start_time > DB_CONNECTION_TIMEOUT):
            
            if self.db:
                logger.info("Closing old database connection due to timeout")
                self.db.close()
            
            self.db = SessionLocal()
            self.db_start_time = current_time
            logger.debug("Created new database session")
        
        return self.db
    
    def _close_db_session(self):
        """Close database session"""
        if self.db:
            self.db.close()
            self.db = None
            self.db_start_time = None
            logger.debug("Closed database session")
    
    def get_user_session_cookie(self, user_id: int, db):
        """Get session cookie for user, with caching"""
        user_config = db.query(UserConfig).filter(UserConfig.user_id == user_id).first()
        if user_config and user_config.leetcode_session_cookie:
            return user_config.leetcode_session_cookie
        else:
            return None
    
    def process_record(self, submission_id: int):
        """Process a single record with rate limiting"""
        db = self._get_db_session()
        
        try:
            rec = db.query(Record).filter(Record.submission_id == submission_id).first()
            if not rec:
                logger.warning(f"Record {submission_id} not found in database, skipping")
                return
                
            user = db.query(User).filter(User.id == rec.user_id).first()
            if not user:
                logger.warning(f"User {rec.user_id} not found, skipping record {rec.submission_id}")
                return
                
            if not getattr(user, 'sync_allowed', True):
                logger.info(f"User {rec.user_id} sync not allowed, skipping record {rec.submission_id}")
                return
                
            if rec.sync_status != "pending":
                logger.info(f"Record {rec.submission_id} status is {rec.sync_status}, skipping")
                return
            
            # Apply rate limiting using Redis with custom configuration
            wait_time = self.rate_limiter.wait_if_needed(
                rec.user_id,
                SUBMISSION_FETCH_RATE_LIMIT["max_requests"],
                SUBMISSION_FETCH_RATE_LIMIT["window_seconds"],
                SUBMISSION_FETCH_RATE_LIMIT["operation"]
            )
            
            if wait_time > 0:
                logger.info(f"Rate limited for user {rec.user_id}, waited {wait_time:.2f} seconds")
            
            # Get session cookie for user
            session_cookie = self.get_user_session_cookie(rec.user_id, db)
            if not session_cookie:
                logger.error(f"No session cookie found for user {rec.user_id}")
                rec.sync_status = "failed"
                db.commit()
                return
            
            # Initialize GraphQL service if needed or if user changed
            if self.last_processed_user != rec.user_id:
                logger.info(f"User changed from {self.last_processed_user} to {rec.user_id}, initializing GraphQL service")
                if self.graphql_service:
                    self.graphql_service.close()
                self.graphql_service = LeetCodeGraphQLService(session_cookie)
                self.last_processed_user = rec.user_id
            
            # Mark as syncing
            rec.sync_status = "syncing"
            db.commit()
            
            logger.info(f"Processing record {rec.submission_id} for user {rec.user_id}")
            
            # Fetch detailed information (code)
            try:
                details = self.graphql_service.get_submission_details(rec.submission_id)
                if details:
                    # Update basic information
                    rec.code = details.get("code", "")
                    
                    # Update performance metrics
                    rec.runtime_percentile = details.get("runtime_percentile")
                    rec.memory_percentile = details.get("memory_percentile")
                    
                    # Update test case information
                    rec.total_correct = details.get("total_correct", 0)
                    rec.total_testcases = details.get("total_testcases", 0)
                    rec.success_rate = details.get("success_rate", 0.0)
                    
                    # Update error and output information
                    rec.runtime_error = details.get("runtime_error", "")
                    rec.compile_error = details.get("compile_error", "")
                    rec.code_output = details.get("code_output", "")
                    rec.expected_output = details.get("expected_output", "")
                    
                    # Update topic tags if available
                    if details.get("topic_tags"):
                        rec.topic_tags = details.get("topic_tags", [])
                    
                    rec.sync_status = "synced"
                    logger.info(f"Successfully synced record {rec.submission_id}")
                    logger.info(f"Test cases: {rec.total_correct}/{rec.total_testcases} ({rec.success_rate}% success rate)")
                else:
                    rec.sync_status = "failed"
                    logger.warning(f"Failed to fetch code for record {rec.submission_id}")
            except Exception as e:
                rec.sync_status = "failed"
                logger.error(f"Error fetching code for record {rec.submission_id}: {e}")
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Error processing record {submission_id}: {e}")
            # Don't close DB on error, let it be managed by timeout
    
    def process_batch(self, submission_ids: list):
        """Process multiple records in batch"""
        if not submission_ids:
            return
        
        logger.info(f"Processing batch of {len(submission_ids)} records")
        
        for submission_id in submission_ids:
            try:
                self.process_record(submission_id)
                # Small delay between records in batch
                time.sleep(random.uniform(0.1, 0.5))
            except Exception as e:
                logger.error(f"Error processing record {submission_id} in batch: {e}")
        
        logger.info(f"Completed processing batch of {len(submission_ids)} records")
    
    def close(self):
        """Close GraphQL service and database connection"""
        if self.graphql_service:
            self.graphql_service.close()
            self.graphql_service = None
            logger.info("GraphQL service closed")
        
        self._close_db_session()

def main():
    """Main function that runs the consumer"""
    r = redis.Redis.from_url(REDIS_URL)
    consumer = LeetCodeConsumer()
    
    logger.info("Starting LeetCode sync consumer (GraphQL) with rate limiting")
    logger.info(f"Batch size: {BATCH_SIZE}")
    logger.info(f"Database connection timeout: {DB_CONNECTION_TIMEOUT} seconds")
    
    try:
        while True:
            try:
                # Collect batch of submission IDs
                submission_ids = []
                
                # Try to get BATCH_SIZE records from queue
                for _ in range(BATCH_SIZE):
                    result = r.brpop(QUEUE_NAME, timeout=1)
                    if result:
                        submission_id = int(result[1])
                        submission_ids.append(submission_id)
                    else:
                        break
                
                if submission_ids:
                    # Process batch
                    consumer.process_batch(submission_ids)
                else:
                    # No records in queue, sleep briefly
                    time.sleep(1)
                    
            except Exception as e:
                logger.error(f"Consumer error: {e}")
                time.sleep(1)  # Wait before retrying
                
    except KeyboardInterrupt:
        logger.info("Shutting down consumer...")
    finally:
        consumer.close()

if __name__ == "__main__":
    main() 