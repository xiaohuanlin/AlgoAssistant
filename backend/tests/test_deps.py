import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from jose import JWTError
from app.deps import get_current_user
from app.models import User

class TestDependencies:
    """Test dependency injection functions."""
    
    def test_get_current_user_success(self, db_session):
        """Test successful user authentication."""
        # Create user first
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Mock JWT token
        with patch('app.deps.jwt.decode') as mock_decode:
            mock_decode.return_value = {"sub": "testuser"}
            
            # Test the dependency
            current_user = get_current_user("valid_token", db_session)
            
            assert current_user is not None
            assert current_user.username == "testuser"
    
    def test_get_current_user_invalid_token(self, db_session):
        """Test authentication with invalid token."""
        with patch('app.deps.jwt.decode') as mock_decode:
            mock_decode.side_effect = JWTError("Invalid token")
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_user("invalid_token", db_session)
            
            assert exc_info.value.status_code == 401
            assert "Could not validate credentials" in str(exc_info.value.detail)
    
    def test_get_current_user_no_username(self, db_session):
        """Test authentication with token that has no username."""
        with patch('app.deps.jwt.decode') as mock_decode:
            mock_decode.return_value = {"sub": None}
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_user("valid_token", db_session)
            
            assert exc_info.value.status_code == 401
            assert "Could not validate credentials" in str(exc_info.value.detail)
    
    def test_get_current_user_user_not_found(self, db_session):
        """Test authentication with non-existent user."""
        with patch('app.deps.jwt.decode') as mock_decode:
            mock_decode.return_value = {"sub": "nonexistent_user"}
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_user("valid_token", db_session)
            
            assert exc_info.value.status_code == 401
            assert "Could not validate credentials" in str(exc_info.value.detail) 