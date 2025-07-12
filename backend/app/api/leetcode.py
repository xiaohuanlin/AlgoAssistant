from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_user
from app.services.service_factory import ServiceFactory
from app.services.record_service import RecordService
from app.services.leetcode_service import LeetCodeService
from app.schemas import SyncLogOut
from app import models
from typing import List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/leetcode", tags=["leetcode"])

@router.post("/sync", response_model=dict)
def sync_leetcode_records(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Request LeetCode sync - sets sync flag for producer to process"""
    logger.info(f"User {current_user.username} requested LeetCode sync")
    
    # Get user configuration
    user_config = current_user.configs
    if not user_config or not user_config.leetcode_name:
        logger.warning(f"User {current_user.username} has no LeetCode configuration")
        raise HTTPException(status_code=400, detail="LeetCode username not configured.")
    
    # Get cookies for crawling
    session_cookie = user_config.leetcode_session_cookie
    csrf_token = user_config.leetcode_csrf_token
    
    if not session_cookie:
        logger.warning(f"User {current_user.username} has no session cookie configured")
        raise HTTPException(
            status_code=400, 
            detail="LeetCode session cookie not configured. Please configure your LeetCode session cookie in settings."
        )
    
    try:
        # Set user sync flag to allow producer to process this user
        current_user.sync_allowed = True
        db.commit()
        
        logger.info(f"Sync flag set for user {current_user.username}")
        
        return {
            "status": "success",
            "message": "Sync request submitted successfully. Your submissions will be synced in the background.",
            "user_id": current_user.id,
            "username": current_user.username
        }
        
    except Exception as e:
        logger.error(f"Error setting sync flag for user {current_user.username}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit sync request: {str(e)}")

@router.get("/sync/progress")
def get_sync_progress(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get current sync progress for user"""
    try:
        # Get total records count
        total_records = db.query(models.Record).filter(
            models.Record.user_id == current_user.id
        ).count()
        
        # Get records by sync status
        pending_count = db.query(models.Record).filter(
            models.Record.user_id == current_user.id,
            models.Record.sync_status == "pending"
        ).count()
        
        syncing_count = db.query(models.Record).filter(
            models.Record.user_id == current_user.id,
            models.Record.sync_status == "syncing"
        ).count()
        
        synced_count = db.query(models.Record).filter(
            models.Record.user_id == current_user.id,
            models.Record.sync_status == "synced"
        ).count()
        
        failed_count = db.query(models.Record).filter(
            models.Record.user_id == current_user.id,
            models.Record.sync_status == "failed"
        ).count()
        
        # Calculate progress percentage
        progress_percentage = 0
        if total_records > 0:
            progress_percentage = int((synced_count / total_records) * 100)
        
        return {
            "user_id": current_user.id,
            "username": current_user.username,
            "total_records": total_records,
            "pending_count": pending_count,
            "syncing_count": syncing_count,
            "synced_count": synced_count,
            "failed_count": failed_count,
            "progress_percentage": progress_percentage,
            "sync_allowed": getattr(current_user, 'sync_allowed', True)
        }
        
    except Exception as e:
        logger.error(f"Error getting sync progress for user {current_user.username}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get sync progress: {str(e)}")

@router.post("/sync/stop")
def stop_sync(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Stop sync for current user"""
    try:
        current_user.sync_allowed = False
        db.commit()
        
        logger.info(f"Sync stopped for user {current_user.username}")
        
        return {
            "status": "success",
            "message": "Sync stopped successfully"
        }
        
    except Exception as e:
        logger.error(f"Error stopping sync for user {current_user.username}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to stop sync: {str(e)}")

@router.get("/sync/logs")
def get_sync_logs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get sync logs for current user"""
    logger.debug(f"Fetching sync logs for user {current_user.username}")
    
    logs = db.query(models.SyncLog).filter(
        models.SyncLog.user_id == current_user.id
    ).order_by(models.SyncLog.sync_time.desc()).limit(50).all()
    
    logger.debug(f"Found {len(logs)} sync logs for user {current_user.username}")
    return logs

@router.get("/test-connection")
def test_connection(
    use_playwright: bool = False,
    username: str = None,
    password: str = None,
    current_user = Depends(get_current_user)
):
    """Test LeetCode connection with detailed diagnostics"""
    logger.info(f"=== Starting connection test for user {current_user.username} ===")
    logger.info(f"Test parameters: use_playwright={use_playwright}, username_provided={bool(username)}")
    
    # Get user configuration
    user_config = current_user.configs
    logger.debug(f"User config found: {user_config is not None}")
    
    if not user_config or not user_config.leetcode_name:
        logger.error(f"User {current_user.username} has no LeetCode configuration")
        raise HTTPException(status_code=400, detail="LeetCode username not configured.")
    
    logger.info(f"LeetCode username: {user_config.leetcode_name}")
    
    session_cookie = user_config.leetcode_session_cookie
    csrf_token = user_config.leetcode_csrf_token
    
    logger.debug(f"Session cookie present: {bool(session_cookie)}")
    logger.debug(f"CSRF token present: {bool(csrf_token)}")
    
    # Check if we have either session cookie or username/password
    if not session_cookie and not (username and password):
        logger.error(f"User {current_user.username} has no authentication method configured")
        raise HTTPException(
            status_code=400, 
            detail="No authentication method configured. Please provide either session cookie or username/password."
        )
    
    try:
        import requests
        
        # Test connection with detailed diagnostics
        if use_playwright:
            logger.info("=== Using GraphQL API for connection test ===")
            # Use GraphQL service
            from app.services.leetcode_graphql_service import LeetCodeGraphQLService
            
            logger.info("Initializing GraphQL service...")
            graphql_service = LeetCodeGraphQLService(session_cookie)
            
            # Test GraphQL service by getting user profile
            logger.info("Testing GraphQL service by getting user profile...")
            try:
                profile = graphql_service.get_user_profile()
                if profile and profile.get('isSignedIn'):
                    logger.info("GraphQL service test successful")
                    graphql_service.close()
                    return {
                        "status": "success",
                        "message": "GraphQL connection test successful. Your LeetCode configuration is working properly.",
                        "details": {
                            "username": user_config.leetcode_name,
                            "has_session_cookie": bool(session_cookie),
                            "has_csrf_token": bool(csrf_token),
                            "method": "graphql",
                            "auth_method": "session_cookie",
                            "suggestion": "You can now proceed with syncing your LeetCode submissions using GraphQL API."
                        }
                    }
                else:
                    logger.error("GraphQL service test failed: User not signed in")
                    graphql_service.close()
                    return {
                        "status": "error",
                        "message": "Authentication failed",
                        "details": {
                            "step": "graphql_authentication",
                            "error": "User not signed in",
                            "suggestion": "Please check your session cookie. Go to LeetCode, login, press F12, find LEETCODE_SESSION in Application/Storage/Cookies, and copy its value."
                        }
                    }
            except Exception as e:
                logger.error(f"GraphQL service test failed: {e}")
                graphql_service.close()
                return {
                    "status": "error",
                    "message": "Failed to connect to LeetCode GraphQL API",
                    "details": {
                        "step": "graphql_connection",
                        "error": str(e),
                        "suggestion": "Check your internet connection and LeetCode API accessibility."
                    }
                }
        else:
            logger.info("=== Using query service for connection test ===")
            # Use query service
            from app.services.leetcode_query_service import LeetCodeQueryService
            
            logger.info("Initializing query service...")
            query_service = LeetCodeQueryService(session_cookie=session_cookie)
            
            # Step 1: Test basic network connectivity
            logger.info("Step 1: Testing basic network connectivity...")
            try:
                response = requests.get('https://leetcode.com/', timeout=10)
                logger.debug(f"Network connectivity test - Status: {response.status_code}")
                logger.debug(f"Network connectivity test - Headers: {dict(response.headers)}")
                
                if response.status_code != 200:
                    logger.error(f"Network connectivity failed: HTTP {response.status_code}")
                    return {
                        "status": "error",
                        "message": f"Network connectivity issue: HTTP {response.status_code}",
                        "details": {
                            "step": "network_connectivity",
                            "status_code": response.status_code,
                            "suggestion": "Check your internet connection and try again."
                        }
                    }
                logger.info("Basic network connectivity: OK")
            except requests.exceptions.RequestException as e:
                logger.error(f"Network connectivity exception: {e}")
                return {
                    "status": "error",
                    "message": "Network connectivity failed",
                    "details": {
                        "step": "network_connectivity",
                        "error": str(e),
                        "suggestion": "Check your internet connection and firewall settings."
                    }
                }
            
            # Step 2: Test LeetCode API connection
            logger.info("Step 2: Testing LeetCode API connection...")
            connection_test = query_service.test_connection()
            logger.debug(f"API connection test result: {connection_test}")
            
            if connection_test["status"] != "success":
                logger.error(f"API connection test failed: {connection_test['message']}")
                return {
                    "status": "error",
                    "message": "Failed to connect to LeetCode API",
                    "details": {
                        "step": "api_connection",
                        "error": connection_test["message"],
                        "suggestion": "LeetCode API may be temporarily unavailable. Try again later."
                    }
                }
            logger.info("LeetCode API connection: OK")
            
            # Step 3: Test session cookie validity
            logger.info("Step 3: Testing session cookie validity...")
            auth_test = query_service.test_authentication()
            logger.debug(f"Session cookie validation result: {auth_test}")
            
            if auth_test["status"] != "success":
                logger.error(f"Session cookie validation failed: {auth_test['message']}")
                return {
                    "status": "error",
                    "message": "Session cookie is invalid or expired",
                    "details": {
                        "step": "session_validation",
                        "error": auth_test["message"],
                        "suggestion": "Please update your LeetCode session cookie. Go to LeetCode, login, press F12, find LEETCODE_SESSION in Application/Storage/Cookies, and copy its value."
                    }
                }
            logger.info("Session cookie validation: OK")
            
            # Step 4: Test user profile access
            logger.info("Step 4: Testing user profile access...")
            try:
                profile = query_service.get_user_profile(user_config.leetcode_name)
                logger.debug(f"User profile test result: {profile}")
                
                if not profile:
                    logger.error("Failed to access user profile")
                    return {
                        "status": "error",
                        "message": "Failed to access user profile",
                        "details": {
                            "step": "profile_access",
                            "suggestion": "Your session cookie may not have sufficient permissions or the username may be incorrect."
                        }
                    }
                logger.info("User profile access: OK")
            except Exception as e:
                logger.warning(f"Profile access test failed: {e}")
                # Don't fail the test for this, just log it
            
            logger.info("=== Query service connection test completed successfully ===")
            return {
                "status": "success",
                "message": "Connection test successful. Your LeetCode configuration is working properly.",
                "details": {
                    "username": user_config.leetcode_name,
                    "has_session_cookie": bool(session_cookie),
                    "has_csrf_token": bool(csrf_token),
                    "method": "api",
                    "suggestion": "You can now proceed with syncing your LeetCode submissions."
                }
            }
            
    except Exception as e:
        logger.error(f"Connection test failed for user {current_user.username}: {e}")
        logger.exception("Full exception details:")
        return {
            "status": "error",
            "message": f"Connection test failed: {str(e)}",
            "details": {
                "step": "general_error",
                "error": str(e),
                "suggestion": "Please check your configuration and try again. If the problem persists, try updating your session cookie."
            }
        } 

@router.get("/profile")
def get_leetcode_profile(
    username: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get LeetCode user profile information"""
    logger.info(f"User {current_user.username} requested LeetCode profile")
    
    # Get user configuration
    user_config = current_user.configs
    if not user_config or not user_config.leetcode_session_cookie:
        logger.warning(f"User {current_user.username} has no LeetCode session cookie configured")
        raise HTTPException(
            status_code=400, 
            detail="LeetCode session cookie not configured. Please configure your LeetCode session cookie in settings."
        )
    
    try:
        # Initialize GraphQL service
        from app.services.leetcode_graphql_service import LeetCodeGraphQLService
        graphql_service = LeetCodeGraphQLService(user_config.leetcode_session_cookie)
        
        # Get user profile
        profile = graphql_service.get_user_profile(username)
        
        if not profile:
            logger.error(f"Failed to fetch LeetCode profile for user {current_user.username}")
            raise HTTPException(
                status_code=404, 
                detail="Failed to fetch LeetCode profile. Please check your session cookie and try again."
            )
        
        logger.info(f"Successfully fetched LeetCode profile for user {current_user.username}")
        
        # Clean up service
        graphql_service.close()
        
        return {
            "status": "success",
            "message": "LeetCode profile fetched successfully",
            "data": profile
        }
        
    except Exception as e:
        logger.error(f"Error fetching LeetCode profile for user {current_user.username}: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch LeetCode profile: {str(e)}"
        ) 