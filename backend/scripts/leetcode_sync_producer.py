import os
import sys
import time
import redis
import random

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
PRODUCER_INTERVAL = int(os.getenv("PRODUCER_INTERVAL", "60"))  # 60 seconds default
MAX_SUBMISSIONS_PER_USER = int(os.getenv("MAX_SUBMISSIONS_PER_USER", "2000"))
USER_RATE_LIMIT_DELAY = float(os.getenv("USER_RATE_LIMIT_DELAY", "5.0"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))

# Rate limit configuration for this producer
GRAPHQL_RATE_LIMIT = {
    "max_requests": 10,  # 10 requests
    "window_seconds": 60,  # per minute
    "operation": "graphql"
}

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fetch_user_submissions(user_id: int, user_config: UserConfig, db, redis_client, rate_limiter):
    """Fetch user submissions using GraphQL service with batch processing and rate limiting"""
    if not user_config.leetcode_session_cookie:
        logger.warning(f"No session cookie for user {user_id}")
        return
    
    # Disable sync for this user
    user = db.query(User).filter(User.id == user_id).first()
    user.sync_allowed = "false"
    db.commit()
    logger.info(f"Disabled sync for user {user_id} during processing")
    
    try:
        logger.info(f"Fetching submissions for user {user_id} (LeetCode: {user_config.leetcode_name})")
        
        # Apply rate limiting before starting fetch with custom configuration
        wait_time = rate_limiter.wait_if_needed(
            user_id,
            GRAPHQL_RATE_LIMIT["max_requests"],
            GRAPHQL_RATE_LIMIT["window_seconds"],
            GRAPHQL_RATE_LIMIT["operation"]
        )
        
        if wait_time > 0:
            logger.info(f"Rate limited for user {user_id}, waited {wait_time:.2f} seconds before starting fetch")
        
        graphql_service = LeetCodeGraphQLService(user_config.leetcode_session_cookie)
        try:
            # Fetch submissions in batches
            total_new = 0
            total_skipped = 0
            for batch in graphql_service.get_all_user_submissions(
                max_submissions=MAX_SUBMISSIONS_PER_USER, batch_size=20):
                if not batch:
                    continue
                # Batch query existing submission IDs
                batch_submission_ids = [sub.get('submission_id') for sub in batch]
                existing_records = db.query(Record.submission_id).filter(
                    Record.user_id == user_id,
                    Record.submission_id.in_(batch_submission_ids)
                ).all()
                existing_submission_ids = {record.submission_id for record in existing_records}
                # Filter out new submissions
                new_records = []
                new_submission_ids = []
                skipped_count = 0
                for submission in batch:
                    submission_id = submission.get('submission_id')
                    if submission_id not in existing_submission_ids:
                        new_record = Record(
                            user_id=user_id,
                            oj_type=submission.get('oj_type', 'leetcode'),
                            submission_id=submission_id,
                            problem_title=submission.get('problem_title'),
                            status=submission.get('status'),
                            sync_status='pending',
                            language=submission.get('language'),
                            code='',
                            submit_time=submission.get('submit_time'),
                            runtime=submission.get('runtime'),
                            memory=submission.get('memory'),
                            submission_url=submission.get('submission_url'),
                        )
                        new_records.append(new_record)
                        new_submission_ids.append(submission_id)
                    else:
                        skipped_count += 1
                # Batch insert new records
                if new_records:
                    db.add_all(new_records)
                    db.flush()
                    # Batch push new submission IDs to queue
                    if new_submission_ids:
                        redis_client.lpush(QUEUE_NAME, *new_submission_ids)
                    logger.info(f"User {user_id}: Batch inserted {len(new_records)} new records")
                db.commit()
                logger.info(f"User {user_id}: Batch added {len(new_records)} new records, skipped {skipped_count} existing records")
                total_new += len(new_records)
                total_skipped += skipped_count
            logger.info(f"User {user_id}: Total new records {total_new}, total skipped {total_skipped}")
        finally:
            graphql_service.close()
    except Exception as e:
        logger.error(f"Error processing user {user_id}: {e}")
        db.rollback()

def main():
    """Main function that runs the producer"""
    r = redis.Redis.from_url(REDIS_URL)
    rate_limiter = get_global_rate_limiter(r)
    
    logger.info("Starting LeetCode sync producer (GraphQL) with rate limiting")
    logger.info(f"Producer interval: {PRODUCER_INTERVAL} seconds")
    logger.info(f"Max submissions per user: {MAX_SUBMISSIONS_PER_USER}")
    logger.info(f"User rate limit delay: {USER_RATE_LIMIT_DELAY} seconds")
    
    while True:
        db = SessionLocal()
        try:
            # Get users with LeetCode configuration
            users_with_config = db.query(User).join(UserConfig).filter(
                UserConfig.leetcode_session_cookie.isnot(None)
            ).all()
            
            logger.info(f"Found {len(users_with_config)} users with LeetCode configuration")
            
            processed_users = 0
            for user in users_with_config:
                # Check if sync is allowed for this user
                if getattr(user, 'sync_allowed', True) == True or getattr(user, 'sync_allowed', True) == "true":
                    user_config = db.query(UserConfig).filter(UserConfig.user_id == user.id).first()
                    if user_config:
                        logger.info(f"Starting sync for user {user.id} (LeetCode: {user_config.leetcode_name})")
                        fetch_user_submissions(user.id, user_config, db, r, rate_limiter)
                        processed_users += 1
                        
                        # Rate limiting between users
                        if processed_users < len(users_with_config):
                            delay = USER_RATE_LIMIT_DELAY + random.uniform(0, 2)
                            logger.info(f"Rate limiting: waiting {delay:.2f} seconds before next user")
                            time.sleep(delay)
                else:
                    logger.info(f"Sync not allowed for user {user.id} (sync_allowed: {getattr(user, 'sync_allowed', True)}), skipping")
            
            logger.info(f"Producer cycle completed. Processed {processed_users} users.")
            logger.info(f"Sleeping for {PRODUCER_INTERVAL} seconds before next cycle")
            time.sleep(PRODUCER_INTERVAL)
            
        except Exception as e:
            logger.error(f"Producer error: {e}")
            time.sleep(10)  # Wait before retrying
        finally:
            db.close()

if __name__ == "__main__":
    main() 