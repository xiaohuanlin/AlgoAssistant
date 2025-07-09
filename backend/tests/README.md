# AlgoAssistant Testing Documentation

## Test Structure

```
tests/
├── __init__.py
├── conftest.py              # pytest configuration and common fixtures
├── test_utils_security.py   # Security utilities testing
├── test_models.py           # Data models testing
├── test_services_*.py       # Service layer testing
└── test_api_*.py            # API integration testing
```

## Running Tests

### Quick Start with Tox

```bash
# Navigate to backend directory
cd backend

# Install tox
pip install tox

# Run all tests (Python 3.11 and 3.12)
tox

# Run tests for specific Python version
tox -e py311
tox -e py312

# Run tests with coverage report
tox -e coverage

# Run code quality checks
tox -e lint

# Run security checks
tox -e security

# Run fast tests (stop on first failure)
tox -e fast

# Run specific test with tox
tox -- tests/test_utils_security.py::TestSecurityUtils::test_password_hashing
```

### Direct pytest Usage

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run all tests
pytest

# Run specific test file
pytest tests/test_utils_security.py

# Run specific test class
pytest tests/test_utils_security.py::TestSecurityUtils

# Run specific test method
pytest tests/test_utils_security.py::TestSecurityUtils::test_password_hashing

# Generate coverage report
pytest --cov=app --cov-report=html
```

## Test Types

### 1. Unit Tests

Testing individual functions and methods:

- **Security Utilities Testing** (`test_utils_security.py`)
  - Password hashing and verification
  - Data encryption and decryption
  - Fernet instance creation

- **Data Models Testing** (`test_models.py`)
  - Model creation and field validation
  - Relationship mapping tests
  - Database constraint tests

- **Service Layer Testing** (`test_services_*.py`)
  - Business logic testing
  - Error handling tests
  - Configuration validation tests

### 2. Integration Tests

Testing API endpoints and component interactions:

- **API Testing** (`test_api_*.py`)
  - HTTP request/response testing
  - Authentication and authorization tests
  - Data validation tests

## Test Fixtures

### Database Fixtures

```python
@pytest.fixture
def db_session(db_engine):
    """Create test database session with automatic rollback after each test"""
    # Uses in-memory SQLite database
    # Automatic transaction rollback ensures test isolation
```

### Test Data Fixtures

```python
@pytest.fixture
def test_user_data():
    """Sample user data for testing"""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "nickname": "Test User"
    }
```

### HTTP Client Fixture

```python
@pytest.fixture
def client(db_session):
    """Create test HTTP client"""
    # Automatically injects test database
    # Supports complete API testing
```

## Testing Best Practices

### 1. Test Naming

- Test files: `test_module_name.py`
- Test classes: `TestClassName`
- Test methods: `test_functionality_description`

### 2. Test Isolation

- Each test uses independent database session
- Automatic data cleanup after tests
- Avoid dependencies between tests

### 3. Test Coverage

- Normal flow testing
- Boundary condition testing
- Error handling testing
- Exception scenario testing

### 4. Assertion Best Practices

```python
# Good assertions
assert user.id is not None
assert user.username == "testuser"
assert "password" not in response_data  # Sensitive data should not be returned

# Avoid these assertions
assert user  # Not specific enough
assert len(users) > 0  # Should check specific count
```

## Coverage Requirements

- Target coverage: 80% or higher
- Core business logic: 90% or higher
- Security-related code: 100%

## Continuous Integration

Tests automatically run in the following scenarios:

1. On code commits
2. When creating Pull Requests
3. Before deployment validation

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Ensure PostgreSQL is running
   docker-compose up postgres -d
   ```

2. **Missing Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Test Permission Issues**
   ```bash
   chmod +x scripts/run_tests.sh
   ```

### Debugging Tests

```bash
# Verbose output
pytest -v -s

# Run only failed tests
pytest --lf

# Stop on first failure
pytest -x

# Show slowest tests
pytest --durations=10
```

## Adding New Tests

### 1. Create Test File

```python
# tests/test_new_feature.py
import pytest
from app.services.new_service import NewService

class TestNewFeature:
    def test_new_functionality(self, db_session):
        """Test new functionality"""
        service = NewService(db_session)
        result = service.do_something()
        assert result is not None
```

### 2. Add API Tests

```python
# tests/test_api_new_feature.py
def test_new_api_endpoint(self, client, test_user_data):
    """Test new API endpoint"""
    # Register user
    response = client.post("/api/register", json=test_user_data)
    assert response.status_code == 200
    
    # Test new endpoint
    response = client.get("/api/new-endpoint")
    assert response.status_code == 200
```

### 3. Update Test Documentation

Remember to update this documentation to explain the purpose and usage of new tests.

## Test Environment

### Database Configuration

- **Test Database**: In-memory SQLite
- **Isolation**: Each test uses separate transaction
- **Cleanup**: Automatic rollback after each test

### Dependencies

- **pytest**: Test framework
- **pytest-asyncio**: Async test support
- **httpx**: HTTP client for API testing
- **pytest-cov**: Coverage reporting
- **factory-boy**: Test data generation

## Performance Considerations

### Test Execution Time

- Unit tests: < 1 second each
- Integration tests: < 5 seconds each
- Full test suite: < 2 minutes

### Memory Usage

- In-memory database reduces I/O
- Automatic cleanup prevents memory leaks
- Minimal test data to reduce overhead

## Security Testing

### Authentication Tests

- JWT token validation
- Password hashing verification
- OAuth flow testing

### Data Protection Tests

- Sensitive data encryption
- Token storage security
- API access control

## Mock and Stub Usage

### External Service Mocking

```python
# Mock external API calls
@patch('app.services.openai_service.openai.ChatCompletion.create')
def test_openai_service_mock(mock_openai):
    mock_openai.return_value = MockResponse()
    # Test implementation
```

### Database Stubbing

```python
# Use test fixtures for database operations
def test_with_mock_data(db_session, test_user_data):
    # Database operations use test data
    pass
```

## Test Data Management

### Fixture Organization

- Common data in `conftest.py`
- Module-specific data in test files
- Dynamic data generation when needed

### Data Cleanup

- Automatic cleanup via pytest fixtures
- Transaction rollback ensures isolation
- No persistent test data left behind 