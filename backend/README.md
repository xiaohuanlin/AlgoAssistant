# AlgoAssistant Backend

A comprehensive algorithm practice management system with GitHub OAuth integration, Notion sync, and AI-powered analysis.

## Features

- **Multi-platform OJ Support**: LeetCode, HackerRank (extensible)
- **GitHub OAuth Integration**: Secure token-based code pushing with one-click authorization
- **Notion Sync**: Automatic problem and tag synchronization
- **AI Analysis**: OpenAI-powered code analysis and improvement suggestions
- **Review System**: Spaced repetition for wrong problems
- **Tag Management**: Algorithm tags with wiki documentation
- **Multi-user Support**: User isolation and configuration management
- **Comprehensive Testing**: Unit tests, integration tests, and 80%+ code coverage

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed
- Git

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Make startup script executable
chmod +x scripts/start.sh

# Run the startup script
./scripts/start.sh
```

### 2. Manual Setup (Alternative)

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 3. Access Services

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: PostgreSQL on localhost:5432
- **Redis**: localhost:6379

## Development Setup

### 1. Environment Configuration

Create `.env` file with your credentials:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/algo_assistant

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:8000/api/github/callback

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Notion
NOTION_TOKEN=your-notion-token
NOTION_DATABASE_ID=your-notion-database-id
```

### 2. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App with the following settings:
   - **Application name**: AlgoAssistant
   - **Homepage URL**: `http://localhost:3000` (or your frontend URL)
   - **Authorization callback URL**: `http://localhost:8000/api/github/callback`
3. Copy Client ID and Client Secret to `.env`

### 3. Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing

### Running Tests with Tox

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

### Direct pytest Usage (Alternative)

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run all tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html --cov-report=term-missing

# Run specific test file
pytest tests/test_utils_security.py

# Run specific test class
pytest tests/test_utils_security.py::TestSecurityUtils

# Run specific test method
pytest tests/test_utils_security.py::TestSecurityUtils::test_password_hashing
```

### Code Quality Checks

```bash
# Format code with black
black app tests

# Sort imports with isort
isort app tests

# Check code style with flake8
flake8 app tests

# Type checking with mypy
mypy app

# Security check with bandit
bandit -r app
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
pre-commit install

# Run pre-commit on all files
pre-commit run --all-files

# Run specific hook
pre-commit run black --all-files
```

### Test Coverage

- **Target Coverage**: 80% or higher
- **Core Business Logic**: 90% or higher
- **Security-related Code**: 100%

### Test Types

- **Unit Tests**: Individual functions and methods
- **Integration Tests**: API endpoints and component interactions
- **Security Tests**: Authentication, authorization, and data protection
- **Code Quality Tests**: Style, formatting, and type checking

### Test Structure

```
tests/
├── conftest.py              # pytest configuration and fixtures
├── test_utils_security.py   # Security utilities testing
├── test_models.py           # Data models testing
├── test_services_*.py       # Service layer testing
└── test_api_*.py            # API integration testing
```

For detailed testing documentation, see [tests/README.md](tests/README.md).

## Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# Restart backend only
docker-compose restart backend

# Rebuild and start
docker-compose up --build -d

# Access database
docker-compose exec postgres psql -U postgres -d algo_assistant
```

## API Documentation

### Authentication

All endpoints require JWT authentication except:
- `POST /api/users/register`
- `POST /api/users/login`

### Core Endpoints

#### Users
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user info

#### Records
- `GET /api/records` - List user's problem records
- `POST /api/records` - Create new record
- `GET /api/records/{record_id}` - Get specific record
- `PUT /api/records/{record_id}` - Update record
- `DELETE /api/records/{record_id}` - Delete record

#### LeetCode Sync
- `POST /api/leetcode/sync` - Sync LeetCode submissions
- `GET /api/leetcode/sync/logs` - Get sync history

#### Notion Sync
- `POST /api/notion/sync/{record_id}` - Sync single record to Notion
- `POST /api/notion/sync/batch` - Batch sync records
- `POST /api/notion/sync/tags` - Sync tags to Notion

#### GitHub Integration
- `GET /api/github/auth` - Get GitHub OAuth URL
- `GET /api/github/callback` - OAuth callback handler
- `GET /api/github/status` - Check connection status
- `DELETE /api/github/disconnect` - Disconnect GitHub
- `PUT /api/github/repo` - Update repository name
- `POST /api/github/push/{record_id}` - Push single record to GitHub
- `POST /api/github/push/batch` - Batch push records

#### Review System
- `POST /api/review/mark/{record_id}` - Mark problem as wrong
- `GET /api/review/list` - List all reviews
- `GET /api/review/due` - Get due reviews
- `POST /api/review/{review_id}/complete` - Mark review as completed

#### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create new tag
- `PUT /api/tags/{tag_id}` - Update tag
- `DELETE /api/tags/{tag_id}` - Delete tag
- `POST /api/tags/{record_id}/assign` - Assign tags to record

## Architecture

### Service Layer
- **ServiceFactory**: Dependency injection for user-specific services
- **RecordService**: Problem record management
- **LeetCodeService**: LeetCode API integration
- **NotionService**: Notion API integration
- **GitHubService**: GitHub API with OAuth
- **GitHubOAuthService**: OAuth flow management
- **OpenAIService**: AI analysis
- **ReviewService**: Spaced repetition system

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Encrypted storage for sensitive tokens
- OAuth 2.0 for GitHub integration
- State parameter validation for OAuth security

### Database Models
- **User**: User accounts and authentication
- **UserConfig**: User-specific service configurations (including encrypted GitHub token)
- **Record**: Problem solving records
- **Tag**: Algorithm tags with wiki
- **Review**: Wrong problem tracking
- **SyncLog**: Synchronization history

## Development

### Adding New OJ Platforms

1. Create new service class inheriting from `BaseOJService`
2. Implement required methods
3. Update `ServiceFactory.oj_service` property
4. Add platform-specific sync endpoints

### Adding New Repository Services

1. Create new service class inheriting from `BaseRepoService`
2. Implement OAuth flow if needed
3. Update `ServiceFactory.repo_service` property
4. Add platform-specific push endpoints

### OAuth Integration Pattern

For new OAuth services, follow the GitHub pattern:

1. **OAuth Service**: Handle authorization flow
2. **Token Management**: Encrypt/decrypt tokens
3. **Status Endpoint**: Check connection status
4. **Frontend Component**: User-friendly interface
5. **Success/Error Pages**: Beautiful feedback pages

## Troubleshooting

### Common Issues

1. **Port already in use**: Change ports in `docker-compose.yml`
2. **Database connection failed**: Wait for PostgreSQL to start (check with `docker-compose logs postgres`)
3. **OAuth callback errors**: Verify callback URL in GitHub OAuth app settings
4. **Permission denied**: Run `chmod +x scripts/start.sh`

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f backend
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Follow existing code style and patterns
4. **Add tests for new functionality** - All new features must include unit tests
5. **Ensure test coverage** - Maintain 80%+ overall coverage
6. **Run tests locally** - Use `tox` or `tox -e coverage` before submitting
7. **Install pre-commit hooks** - Run `pre-commit install` for automatic code quality checks
8. Submit pull request

### Development Guidelines

- **Test-Driven Development**: Write tests before implementing features
- **Code Quality**: Follow PEP 8 style guidelines and use black for formatting
- **Type Hints**: Use mypy for static type checking
- **Documentation**: Update API docs and README for new features
- **Security**: Ensure sensitive data is properly encrypted and validated
- **Pre-commit**: Use pre-commit hooks for automatic code quality enforcement

## License

MIT License 