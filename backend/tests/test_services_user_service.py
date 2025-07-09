import pytest
from app.services.user_service import UserService
from app.schemas import UserCreate, UserConfigCreate
from app.utils.security import get_password_hash

class TestUserService:
    """Test UserService functionality."""
    
    def test_create_user(self, db_session):
        """Test user creation with password hashing."""
        service = UserService(db_session)
        user_data = UserCreate(
            username="testuser",
            email="test@example.com",
            password="testpassword123",
            nickname="Test User"
        )
        
        user = service.create_user(user_data)
        
        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.nickname == "Test User"
        assert user.password_hash != "testpassword123"  # Should be hashed
        assert user.created_at is not None
    
    def test_get_user_by_username(self, db_session):
        """Test getting user by username."""
        service = UserService(db_session)
        
        # Create user first
        user_data = UserCreate(
            username="testuser",
            email="test@example.com",
            password="testpassword123"
        )
        created_user = service.create_user(user_data)
        
        # Get user by username
        found_user = service.get_user_by_username("testuser")
        
        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.username == "testuser"
    
    def test_get_user_by_username_not_found(self, db_session):
        """Test getting non-existent user by username."""
        service = UserService(db_session)
        user = service.get_user_by_username("nonexistent")
        assert user is None
    
    def test_get_user_by_email(self, db_session):
        """Test getting user by email."""
        service = UserService(db_session)
        
        # Create user first
        user_data = UserCreate(
            username="testuser",
            email="test@example.com",
            password="testpassword123"
        )
        created_user = service.create_user(user_data)
        
        # Get user by email
        found_user = service.get_user_by_email("test@example.com")
        
        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == "test@example.com"
    
    def test_get_user_by_email_not_found(self, db_session):
        """Test getting non-existent user by email."""
        service = UserService(db_session)
        user = service.get_user_by_email("nonexistent@example.com")
        assert user is None
    
    def test_create_user_config(self, db_session):
        """Test user configuration creation with encryption."""
        service = UserService(db_session)
        
        # Create user first
        user_data = UserCreate(
            username="testuser",
            email="test@example.com",
            password="testpassword123"
        )
        user = service.create_user(user_data)
        
        # Create user config
        config_data = UserConfigCreate(
            leetcode_name="leetcode_user",
            github_repo="user/repo",
            notion_token="notion_token_123",
            notion_db_id="db_123",
            openai_key="openai_key_123"
        )
        
        config = service.create_user_config(user.id, config_data)
        
        assert config.id is not None
        assert config.user_id == user.id
        assert config.leetcode_name == "leetcode_user"
        assert config.github_repo == "user/repo"
        assert config.notion_token != "notion_token_123"  # Should be encrypted
        assert config.notion_db_id == "db_123"
        assert config.openai_key != "openai_key_123"  # Should be encrypted
    
    def test_create_user_config_without_sensitive_data(self, db_session):
        """Test user configuration creation without sensitive data."""
        service = UserService(db_session)
        
        # Create user first
        user_data = UserCreate(
            username="testuser",
            email="test@example.com",
            password="testpassword123"
        )
        user = service.create_user(user_data)
        
        # Create user config without sensitive data
        config_data = UserConfigCreate(
            leetcode_name="leetcode_user",
            github_repo="user/repo"
        )
        
        config = service.create_user_config(user.id, config_data)
        
        assert config.id is not None
        assert config.user_id == user.id
        assert config.leetcode_name == "leetcode_user"
        assert config.github_repo == "user/repo"
        assert config.notion_token is None
        assert config.notion_db_id is None
        assert config.openai_key is None
    
    def test_duplicate_username_creation(self, db_session):
        """Test that creating user with duplicate username raises error."""
        service = UserService(db_session)
        
        # Create first user
        user_data1 = UserCreate(
            username="testuser1",
            email="test1@example.com",
            password="testpassword123"
        )
        service.create_user(user_data1)
        
        # Try to create second user with same username
        user_data2 = UserCreate(
            username="testuser1",  # Same username
            email="test2@example.com",
            password="testpassword123"
        )
        
        # This should raise an IntegrityError due to unique constraint
        with pytest.raises(Exception):  # SQLAlchemy IntegrityError
            service.create_user(user_data2)
    
    def test_duplicate_email_creation(self, db_session):
        """Test that creating user with duplicate email raises error."""
        service = UserService(db_session)
        
        # Create first user
        user_data1 = UserCreate(
            username="testuser1",
            email="test@example.com",
            password="testpassword123"
        )
        service.create_user(user_data1)
        
        # Try to create second user with same email
        user_data2 = UserCreate(
            username="testuser2",
            email="test@example.com",  # Same email
            password="testpassword123"
        )
        
        # This should raise an IntegrityError due to unique constraint
        with pytest.raises(Exception):  # SQLAlchemy IntegrityError
            service.create_user(user_data2)
    
    def test_update_user_config_success(self, db_session):
        """Test successful user config update."""
        service = UserService(db_session)
        
        # Create user first
        user_data = UserCreate(
            username="testuser",
            email="test@example.com",
            password="testpassword123"
        )
        user = service.create_user(user_data)
        
        # Create initial config
        config_data = UserConfigCreate(
            leetcode_name="old_leetcode",
            github_repo="old/repo"
        )
        service.create_user_config(user.id, config_data)
        
        # Update config
        update_data = UserConfigCreate(
            leetcode_name="new_leetcode",
            github_repo="new/repo",
            notion_token="new_token",
            openai_key="new_key"
        )
        
        updated = service.update_user_config(user.id, update_data)
        
        assert updated is not None
        assert updated.leetcode_name == "new_leetcode"
        assert updated.github_repo == "new/repo"
        assert updated.notion_token != "new_token"  # Should be encrypted
        assert updated.openai_key != "new_key"  # Should be encrypted
    
    def test_update_user_config_not_found(self, db_session):
        """Test updating non-existent user config."""
        service = UserService(db_session)
        
        config_data = UserConfigCreate(
            leetcode_name="test_leetcode",
            github_repo="test/repo"
        )
        
        updated = service.update_user_config(999, config_data)
        
        assert updated is None
    
    def test_get_user_config_not_found(self, db_session):
        """Test getting non-existent user config."""
        service = UserService(db_session)
        
        config = service.get_user_config(999)
        
        assert config is None
    
    def test_create_user_config_encryption(self, db_session):
        """Test that sensitive data is properly encrypted."""
        service = UserService(db_session)
        
        # Create user first
        user_data = UserCreate(
            username="testuser",
            email="test@example.com",
            password="testpassword123"
        )
        user = service.create_user(user_data)
        
        # Create config with sensitive data
        config_data = UserConfigCreate(
            leetcode_name="test_leetcode",
            notion_token="sensitive_notion_token",
            openai_key="sensitive_openai_key"
        )
        
        config = service.create_user_config(user.id, config_data)
        
        # Sensitive data should be encrypted
        assert config.notion_token != "sensitive_notion_token"
        assert config.openai_key != "sensitive_openai_key"
        assert config.notion_token is not None
        assert config.openai_key is not None
    
    def test_create_user_config_without_sensitive_data(self, db_session):
        """Test creating config without sensitive data."""
        service = UserService(db_session)
        
        # Create user first
        user_data = UserCreate(
            username="testuser",
            email="test@example.com",
            password="testpassword123"
        )
        user = service.create_user(user_data)
        
        # Create config without sensitive data
        config_data = UserConfigCreate(
            leetcode_name="test_leetcode",
            github_repo="test/repo"
        )
        
        config = service.create_user_config(user.id, config_data)
        
        # Non-sensitive data should be stored as-is
        assert config.leetcode_name == "test_leetcode"
        assert config.github_repo == "test/repo"
        # Sensitive data should be None
        assert config.notion_token is None
        assert config.openai_key is None 