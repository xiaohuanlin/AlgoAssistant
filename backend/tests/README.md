# API Tests

This directory contains tests for the AlgoAssistant backend API endpoints.

## Test Structure

- `conftest.py` - Test configuration and fixtures
- `test_account_settings_integration.py` - Integration tests for account settings endpoints
- `README.md` - This documentation

## Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_account_settings_integration.py

# Run with verbose output
pytest tests/ -v

# Run with coverage (optional)
pytest tests/ --cov=app
```

## Test Coverage

The current tests cover:

1. **User Authentication**
   - User registration
   - User login and token generation

2. **Password Management**
   - Password change with current password verification
   - Wrong password rejection

3. **Avatar Upload**
   - Image file upload and validation
   - File type validation
   - File size limits

4. **Profile Management**
   - User profile updates (nickname, email)

5. **Security**
   - Authentication required for protected endpoints

## Prerequisites

Before running tests:

1. Start the backend server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Ensure database is accessible and properly configured

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Test Configuration

- Base URL: `http://localhost:8000`
- Test user credentials defined in `conftest.py`
- Tests are designed to be idempotent (can be run multiple times)
