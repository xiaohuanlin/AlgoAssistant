# SQLite configuration optimizations for concurrent access
import os
import sqlite3

from sqlalchemy import event
from sqlalchemy.engine import Engine


def configure_sqlite_for_concurrency():
    """Configure SQLite for better concurrency handling"""

    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        """Set SQLite PRAGMAs for optimal concurrency"""
        if "sqlite" in str(dbapi_connection):
            cursor = dbapi_connection.cursor()

            # Enable WAL mode for better concurrency
            cursor.execute("PRAGMA journal_mode=WAL")

            # Set timeout for busy database
            cursor.execute("PRAGMA busy_timeout=30000")

            # Optimize synchronization for performance
            cursor.execute("PRAGMA synchronous=NORMAL")

            # Enable shared cache
            cursor.execute("PRAGMA cache_shared_cache=ON")

            # Set page size for better performance
            cursor.execute("PRAGMA page_size=4096")

            # Enable foreign key constraints
            cursor.execute("PRAGMA foreign_keys=ON")

            # Close cursor
            cursor.close()


class SQLiteConnectionManager:
    """Manager for SQLite connections with retry logic"""

    @staticmethod
    def execute_with_retry(func, max_retries=3, retry_delay=0.1):
        """Execute database operation with retry on lock contention"""
        import time

        for attempt in range(max_retries):
            try:
                return func()
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e) and attempt < max_retries - 1:
                    time.sleep(retry_delay * (2**attempt))  # Exponential backoff
                    continue
                raise
            except Exception:
                raise
