# AlgoAssistant Backend

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-00a393.svg)](https://fastapi.tiangolo.com/)
[![uv](https://img.shields.io/badge/uv-latest-blue.svg)](https://github.com/astral-sh/uv)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AlgoAssistant is a comprehensive platform for managing algorithm problem-solving records, integrating with multiple online judge platforms, and providing AI-powered code analysis. This FastAPI-based backend serves as the core API for the AlgoAssistant application.

## ✨ Features

- 🚀 **High Performance**: Built with FastAPI and optimized with uv package manager
- 🔐 **JWT Authentication**: Secure user authentication and authorization
- 🗄️ **Multi-Database Support**: SQLite for development, PostgreSQL for production
- 🔄 **Platform Integrations**: LeetCode, GitHub, Notion, Google OAuth
- 🤖 **AI-Powered Analysis**: Gemini AI integration for code analysis
- 📊 **Comprehensive Analytics**: Problem-solving statistics and insights
- 🧪 **Full Test Coverage**: 80%+ test coverage with pytest
- 🐳 **Docker Ready**: Multi-stage builds for development and production
- 📈 **Async Task Queue**: Celery with Redis for background processing
- 🛡️ **Security First**: Bandit, Safety checks, and secure defaults

## 🚀 Quick Start

### Prerequisites

Install [uv](https://github.com/astral-sh/uv) - the fast Python package manager:

```bash
# On macOS and Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# On Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or with pip
pip install uv
```

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/algoassistant.git
cd algoassistant/backend

# Install dependencies (auto-creates virtual environment)
uv sync --group dev

# Or use Makefile
make install-dev
```

### 2. Environment Setup

Create a `.env` file:

```bash
# Database
DATABASE_URL=sqlite:///./algoassistant.db
# DATABASE_URL=postgresql://user:password@localhost:5432/algoassistant

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External Services
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0

# Optional: Email configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Run the Application

```bash
# Method 1: Using uv (recommended)
uv run uvicorn app.main:app --reload

# Method 2: Using Makefile
make run

# Method 3: Traditional way
source .venv/bin/activate
uvicorn app.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 4. Verify Installation

```bash
# Run tests
make test

# Check code quality
make quality

# View all available commands
make help
```

## 🛠️ Development Workflow

### Package Management with UV

UV is a fast Python package installer and resolver that's 10-100x faster than pip:

```bash
# Install dependencies
uv sync                 # Production dependencies only
uv sync --group dev     # Include development dependencies
uv sync --group test    # Include test dependencies
uv sync --all-extras    # Install all optional dependencies

# Add new dependencies
uv add fastapi          # Add production dependency
uv add --group dev pytest  # Add development dependency
uv add --optional test pytest-cov  # Add optional dependency

# Update dependencies
uv sync --upgrade       # Update all dependencies
uv lock                 # Generate/update lock file
```

### Available Make Commands

```bash
# Installation
make install            # Install production dependencies
make install-dev        # Install development dependencies
make install-all        # Install all dependencies

# Development
make run               # Start development server
make run-prod          # Start production server

# Testing
make test              # Run all tests
make test-cov          # Run tests with coverage
make test-unit         # Run unit tests only
make test-integration  # Run integration tests only

# Code Quality
make format            # Format code (black + isort)
make format-check      # Check formatting without changes
make lint              # Run linting (flake8 + mypy)
make security          # Run security checks (bandit + safety)
make quality           # Run all quality checks

# Database
make migrate           # Run database migrations
make migrate-create    # Create new migration

# Docker
make docker-build      # Build Docker image
make docker-run        # Run Docker container
make docker-dev        # Run development container

# Maintenance
make clean             # Clean cache files
make clean-venv        # Remove virtual environment
make reinstall         # Reinstall from scratch
make deps-update       # Update all dependencies

# Utilities
make info              # Show project information
make help              # Show all available commands
```

### Testing

```bash
# Run all tests with coverage
uv run pytest --cov=app --cov-report=html

# Run specific test files
uv run pytest tests/test_api_users.py

# Run specific test methods
uv run pytest tests/test_api_users.py::TestUserAPI::test_login_success

# Run tests with different markers
uv run pytest -m unit           # Unit tests only
uv run pytest -m integration    # Integration tests only
uv run pytest -m "not slow"     # Skip slow tests

# Run tests in parallel
uv run pytest -n auto           # Requires pytest-xdist
```

### Code Quality Tools

```bash
# Format code
uv run black .          # Python code formatting
uv run isort .          # Import sorting

# Type checking
uv run mypy .           # Static type checking

# Linting
uv run flake8 .         # Style and error checking

# Security
uv run bandit -r app/   # Security vulnerability scanning
uv run safety check     # Check for known security vulnerabilities
```

## 🐳 Docker Development

### Multi-stage Docker Build

The project includes optimized Docker configuration with multi-stage builds:

```bash
# Build production image
docker build --target production -t algoassistant-backend .

# Build development image
docker build --target development -t algoassistant-backend:dev .

# Run production container
docker run -p 8000:8000 --env-file .env algoassistant-backend

# Run development container with hot reload
docker run -p 8000:8000 -v $(pwd):/app algoassistant-backend:dev
```

### Docker Compose

#### Production Environment

```bash
# Start all services
docker-compose up --build

# Scale specific services
docker-compose up --scale celery_worker=3

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f backend
```

#### Development Environment

```bash
# Start development environment with hot reload
docker-compose -f docker-compose.dev.yml up --build

# Run specific services only
docker-compose -f docker-compose.dev.yml up backend postgres redis

# Access development tools
docker-compose -f docker-compose.dev.yml --profile tools run dev_tools uv run pytest

# Monitor Celery tasks
docker-compose -f docker-compose.dev.yml up flower
# Access at http://localhost:5555
```

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 8000 | FastAPI application |
| Frontend | 3000 | React application |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache and message broker |
| Celery Worker | - | Background task processor |
| Flower | 5555 | Celery monitoring (dev only) |

## 📊 API Documentation

### Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### API Statistics

- **Total Endpoints**: 35+
- **Authentication Required**: 30 endpoints
- **Public Endpoints**: 5 endpoints
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Base URL**: `http://localhost:8000`

## Endpoint Categories

### 1. Health Check (2 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Welcome message | ❌ |
| GET | `/health` | Health check | ❌ |

### 2. User Management (8 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/register` | User registration | ❌ |
| POST | `/api/users/login` | User login | ❌ |
| GET | `/api/users/me` | Get current user | ✅ |
| GET | `/api/users/user/profile` | Get user profile | ✅ |
| PUT | `/api/users/user/profile` | Update user profile | ✅ |
| POST | `/api/users/config` | Create user config | ✅ |
| GET | `/api/users/config` | Get user config | ✅ |
| PUT | `/api/users/config` | Update user config | ✅ |

### 3. Problem Records (10 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/records/` | List records | ✅ |
| POST | `/api/records/` | Create record | ✅ |
| GET | `/api/records/stats` | Get statistics | ✅ |
| GET | `/api/records/{id}` | Get specific record | ✅ |
| PUT | `/api/records/{id}` | Update record | ✅ |
| DELETE | `/api/records/{id}` | Delete record | ✅ |
| GET | `/api/records/tags` | Get all tags | ✅ |
| POST | `/api/records/{id}/tags` | Assign tags | ✅ |
| PUT | `/api/records/tags/{tag_id}/wiki` | Update tag wiki | ✅ |

### 4. Review System (4 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/review/` | Create review for wrong problem | ✅ |
| GET | `/api/review/` | List all reviews | ✅ |
| GET | `/api/review/due` | Get due reviews | ✅ |
| POST | `/api/review/{review_id}/mark-reviewed` | Mark as reviewed | ✅ |

### 5. Platform Integrations (3 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/leetcode/test-connection` | Test LeetCode | ✅ |
| GET | `/api/notion/test_connection` | Test Notion | ✅ |
| GET | `/api/github/test_connection` | Test GitHub | ✅ |

### 6. Google OAuth (5 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/google/auth` | Generate auth URL | ✅ |
| GET | `/api/google/callback` | Handle callback | ❌ |
| GET | `/api/google/status` | Check status | ✅ |
| DELETE | `/api/google/disconnect` | Disconnect | ✅ |
| POST | `/api/google/login` | Login with token | ❌ |

### 7. Synchronization Tasks (4 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/sync_task/` | Create sync task | ✅ |
| GET | `/api/sync_task/` | List sync tasks | ✅ |
| GET | `/api/sync_task/{task_id}` | Get specific task | ✅ |
| DELETE | `/api/sync_task/{task_id}` | Delete task | ✅ |

## Data Models Summary

### User Models
- **UserBase**: Common user fields (username, email, nickname, avatar)
- **UserCreate**: Registration with password
- **UserLogin**: Authentication credentials
- **UserOut**: User data response (excludes password)
- **UserUpdate**: Profile update fields
- **UserConfigBase**: Integration configurations
- **UserConfigCreate**: Configuration creation
- **UserConfigOut**: Configuration response (excludes tokens)

### Record Models
- **RecordBase**: Problem submission data
- **RecordCreate**: New record creation
- **RecordOut**: Record response with metadata
- **RecordStatsOut**: User statistics
- **RecordDeleteResponse**: Deletion confirmation

### Tag Models
- **TagBase**: Algorithm tag data
- **TagCreate**: New tag creation
- **TagOut**: Tag response
- **TagAssignRequest**: Tag assignment
- **TagWikiUpdateRequest**: Wiki update

### Review Models
- **ReviewBase**: Review data
- **ReviewCreate**: New review creation
- **ReviewOut**: Review response

### Sync Task Models
- **SyncTaskCreate**: Task creation
- **SyncTaskQuery**: Task filtering
- **SyncTaskOut**: Task response

### Integration Models

#### GitHub
- **GitHubConfig**: Repository settings
- **GitHubSyncRequest**: Sync operation
- **GitHubSyncResponse**: Sync results
- **GitHubSyncTaskOut**: Task tracking
- **GitHubConnectionTestOut**: Connection test
- **GitHubPushRequest**: Code push
- **GitHubPushResponse**: Push results

#### LeetCode
- **LeetCodeConfig**: Session settings
- **LeetCodeConnectionTestOut**: Connection test
- **LeetCodeProblemBase**: Problem data
- **LeetCodeProblemCreate**: Problem creation
- **LeetCodeProblemOut**: Problem response

#### Notion
- **NotionConfig**: Workspace settings
- **NotionConnectionTestOut**: Connection test
- **NotionSyncRequest**: Sync operation
- **NotionSyncResponse**: Sync results

#### Google
- **GoogleConfig**: OAuth settings
- **GoogleLoginRequest**: Login with token
- **GoogleLoginResponse**: Login response
- **GoogleAuthResponse**: Auth URL
- **GoogleCallbackResponse**: OAuth callback
- **GoogleStatusResponse**: Connection status
- **GoogleDisconnectResponse**: Disconnect confirmation

#### AI
- **GeminiConfig**: Gemini AI settings

## 🏗️ Project Structure

```
backend/
├── app/                          # Main application directory
│   ├── __init__.py
│   ├── main.py                   # FastAPI application entry point
│   ├── database.py               # Database configuration
│   ├── deps.py                   # Dependency injection
│   ├── models.py                 # SQLAlchemy database models
│   ├── types.py                  # Custom type definitions
│   │
│   ├── api/                      # API route handlers
│   │   ├── __init__.py
│   │   ├── users.py              # User management endpoints
│   │   ├── records.py            # Problem record endpoints
│   │   ├── review.py             # Review system endpoints
│   │   ├── dashboard.py          # Dashboard analytics
│   │   ├── sync_task.py          # Synchronization tasks
│   │   ├── leetcode.py           # LeetCode integration
│   │   ├── github.py             # GitHub integration
│   │   ├── notion.py             # Notion integration
│   │   ├── google.py             # Google OAuth integration
│   │   ├── gemini.py             # Gemini AI integration
│   │   └── problem.py            # Problem management
│   │
│   ├── schemas/                  # Pydantic data models
│   │   ├── __init__.py
│   │   ├── user.py               # User schemas
│   │   ├── record.py             # Record schemas
│   │   ├── review.py             # Review schemas
│   │   ├── problem.py            # Problem schemas
│   │   ├── notification.py       # Notification schemas
│   │   ├── github.py             # GitHub integration schemas
│   │   ├── leetcode.py           # LeetCode integration schemas
│   │   ├── notion.py             # Notion integration schemas
│   │   ├── google.py             # Google integration schemas
│   │   └── gemini.py             # Gemini AI schemas
│   │
│   ├── services/                 # Business logic layer
│   │   ├── __init__.py
│   │   ├── base_db_service.py    # Base database service (CRUD operations)
│   │   ├── base_service.py       # Abstract base service
│   │   ├── base_ai_service.py    # Base AI service
│   │   ├── base_oj_service.py    # Base online judge service
│   │   ├── base_repo_service.py  # Base repository service
│   │   ├── base_note_service.py  # Base note-taking service
│   │   ├── user_service.py       # User business logic
│   │   ├── user_config_service.py # User configuration logic
│   │   ├── record_service.py     # Record business logic
│   │   ├── review_service.py     # Review system logic
│   │   ├── problem_service.py    # Problem management logic
│   │   ├── dashboard_service.py  # Analytics and dashboard
│   │   ├── sync_task_service.py  # Task synchronization
│   │   ├── notification_service.py # Notification system
│   │   ├── email_service.py      # Email notifications
│   │   ├── leetcode_service.py   # LeetCode integration
│   │   ├── leetcode_graphql_service.py # LeetCode GraphQL
│   │   ├── github_service.py     # GitHub integration
│   │   ├── google_oauth_service.py # Google OAuth
│   │   ├── notion_service.py     # Notion integration
│   │   └── gemini_service.py     # Gemini AI integration
│   │
│   ├── tasks/                    # Background tasks (Celery)
│   │   ├── __init__.py
│   │   ├── task_manager.py       # Task management
│   │   ├── leetcode_batch_sync.py # LeetCode batch sync
│   │   ├── leetcode_detail_sync.py # LeetCode detail sync
│   │   ├── github_sync.py        # GitHub sync tasks
│   │   ├── notion_sync.py        # Notion sync tasks
│   │   ├── gemini_sync.py        # Gemini AI tasks
│   │   └── review_notification.py # Review reminders
│   │
│   ├── utils/                    # Utility functions
│   │   ├── __init__.py
│   │   ├── security.py           # Password hashing, JWT tokens
│   │   ├── logger.py             # Logging configuration
│   │   └── rate_limiter.py       # Rate limiting utilities
│   │
│   ├── config/                   # Configuration
│   │   ├── __init__.py
│   │   └── settings.py           # Application settings
│   │
│   └── celery_app.py            # Celery application setup
│
├── tests/                        # Test suite
│   ├── __init__.py
│   ├── conftest.py              # Pytest configuration and fixtures
│   ├── test_main_app.py         # Main application tests
│   ├── test_api_*.py            # API endpoint tests
│   ├── test_services_*.py       # Service layer tests
│   └── test_utils_*.py          # Utility function tests
│
├── uploads/                      # File upload directory
├── logs/                         # Application logs
│
├── pyproject.toml               # Project configuration and dependencies
├── uv.lock                      # Dependency lock file (auto-generated)
├── .python-version              # Python version specification
├── setup.cfg                    # Tool configuration (flake8, etc.)
├── pytest.ini                  # Pytest configuration
├── Dockerfile                   # Multi-stage Docker configuration
├── .dockerignore               # Docker build exclusions
├── docker-compose.yml          # Production Docker Compose
├── docker-compose.dev.yml      # Development Docker Compose
├── Makefile                    # Development commands
├── README.md                   # This file
├── QUICK_START.md              # Quick start guide
├── README-UV.md                # UV package manager guide
├── requirements.txt            # Legacy pip requirements (for reference)
├── requirements-dev.txt        # Legacy dev requirements (for reference)
├── tox.ini                     # Multi-environment testing
├── .env.example                # Environment variables template
└── .gitignore                  # Git exclusions
```

## 🔧 Architecture Overview

### Core Components

1. **FastAPI Application (`app/main.py`)**
   - ASGI application with auto-generated OpenAPI docs
   - CORS middleware for cross-origin requests
   - JWT authentication middleware
   - Static file serving for uploads

2. **Database Layer (`app/models.py`)**
   - SQLAlchemy ORM models
   - Database relationships and constraints
   - Migration support with Alembic

3. **Service Layer (`app/services/`)**
   - Business logic separation
   - Base service classes for code reuse
   - Integration services for external APIs

4. **API Layer (`app/api/`)**
   - RESTful endpoint definitions
   - Request/response validation
   - Error handling and status codes

5. **Background Tasks (`app/tasks/`)**
   - Celery task definitions
   - Async processing for long-running operations
   - Queue management and retries

### Data Flow

```
Client Request
    ↓
FastAPI Router (app/api/)
    ↓
Authentication Middleware
    ↓
Route Handler
    ↓
Service Layer (app/services/)
    ↓
Database Models (app/models.py)
    ↓
SQLAlchemy ORM
    ↓
Database (SQLite/PostgreSQL)
```

### External Integrations

- **LeetCode**: Problem fetching and submission sync
- **GitHub**: Code repository management
- **Notion**: Note-taking and documentation sync
- **Google OAuth**: Authentication and Google services
- **Gemini AI**: Code analysis and insights
- **Redis**: Caching and message queue
- **SMTP**: Email notifications

## 🔒 Security Features

### Authentication & Authorization
- JWT tokens with configurable expiration
- Password hashing with bcrypt
- Protected routes with dependency injection
- User session management

### Security Tools
```bash
# Security scanning
make security                    # Run all security checks
uv run bandit -r app/           # Check for security vulnerabilities
uv run safety check             # Check dependencies for known CVEs
```

### Security Best Practices
- Environment variable configuration
- CORS protection
- SQL injection prevention (parameterized queries)
- XSS protection with Pydantic validation
- Rate limiting capabilities
- Secure file upload handling

## 🚀 Performance Optimizations

### UV Package Manager Benefits
- **10-100x faster** than pip for package installation
- **Accurate dependency resolution** with conflict detection
- **Lock file support** for reproducible builds
- **Automatic virtual environment** management

### Database Optimizations
- Connection pooling with SQLAlchemy
- Query optimization with eager loading
- Database indexing on frequently queried fields
- Optional PostgreSQL for production scalability

### Caching Strategy
- Redis for session storage
- Response caching for static data
- Query result caching for expensive operations

### Async Processing
- Celery for background tasks
- Non-blocking I/O with FastAPI
- Async database operations
- Task queue management

## 🧪 Testing Strategy

### Test Coverage
- **80%+ code coverage** requirement
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for critical workflows

### Test Categories
```bash
# Different test types
pytest -m unit           # Fast unit tests
pytest -m integration    # API integration tests
pytest -m slow          # Long-running tests
```

### Test Infrastructure
- **Fixtures** for database setup/teardown
- **Factory patterns** for test data generation
- **Mocking** for external service dependencies
- **Parameterized tests** for multiple scenarios

## 🔍 Monitoring & Observability

### Logging
- Structured logging with JSON format
- Configurable log levels
- Request/response logging
- Error tracking and stack traces

### Health Checks
- Database connectivity checks
- External service health monitoring
- Resource usage monitoring
- Custom health check endpoints

### Metrics (Optional)
- Response time monitoring
- Error rate tracking
- Database query performance
- Background task monitoring

## 🚀 Deployment

### Production Deployment

#### Environment Variables
Create `.env.prod`:
```bash
# Production database
DATABASE_URL=postgresql://user:password@db:5432/algoassistant

# Security (use strong values!)
SECRET_KEY=your-super-secure-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External services
GITHUB_CLIENT_ID=prod-github-client-id
GITHUB_CLIENT_SECRET=prod-github-secret
GOOGLE_CLIENT_ID=prod-google-client-id
GOOGLE_CLIENT_SECRET=prod-google-secret

# Infrastructure
REDIS_URL=redis://redis:6379/0
ENVIRONMENT=production
LOG_LEVEL=INFO
```

#### Docker Production Deployment
```bash
# Build optimized production image
docker build --target production -t algoassistant-backend:latest .

# Run with production configuration
docker run -d \
  --name algoassistant-backend \
  -p 8000:8000 \
  --env-file .env.prod \
  --restart unless-stopped \
  algoassistant-backend:latest

# Or use docker-compose
docker-compose -f docker-compose.yml up -d
```

#### Performance Tuning
```bash
# Run with multiple workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Enable gzip compression
# Configure reverse proxy (nginx) for static files
```

### CI/CD Pipeline Example

```yaml
# .github/workflows/backend.yml
name: Backend CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4

    - name: Install uv
      uses: astral-sh/setup-uv@v2

    - name: Set up Python
      run: uv python install 3.11

    - name: Install dependencies
      run: uv sync --all-extras

    - name: Run tests
      run: uv run pytest --cov=app --cov-report=xml
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379/0

    - name: Run security checks
      run: |
        uv run bandit -r app/
        uv run safety check

    - name: Run linting
      run: |
        uv run black --check .
        uv run isort --check-only .
        uv run flake8 .
        uv run mypy .

    - name: Build Docker image
      run: docker build --target production -t algoassistant-backend .
```

## 🔧 Troubleshooting

### Common Issues

#### 1. **Installation Problems**
```bash
# Clear UV cache and reinstall
uv cache clean
rm -rf .venv
uv sync --group dev

# Verify UV installation
uv --version
uv python list
```

#### 2. **Database Connection Issues**
```bash
# Check database URL format
echo $DATABASE_URL

# Test database connection
uv run python -c "from app.database import engine; print(engine.connect())"

# Reset database (development only)
rm -f *.db
uv run alembic upgrade head
```

#### 3. **Import Errors**
```bash
# Check Python path
export PYTHONPATH=/path/to/backend:$PYTHONPATH

# Verify installation
uv run python -c "import app; print(app.__file__)"
```

#### 4. **Port Already in Use**
```bash
# Find process using port 8000
lsof -ti:8000 | xargs kill -9

# Use different port
uv run uvicorn app.main:app --port 8001
```

#### 5. **Permission Issues**
```bash
# Fix file permissions
chmod +x scripts/*
sudo chown -R $USER:$USER .

# Docker permission issues
sudo usermod -aG docker $USER
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Enable SQLAlchemy query logging
export DATABASE_ECHO=true

# Run with debugger
uv run python -m pdb -c continue app/main.py

# Enable FastAPI debug mode
uv run uvicorn app.main:app --reload --log-level debug
```

### Performance Debugging

```bash
# Profile application performance
uv run python -m cProfile -o profile.stats app/main.py

# Memory profiling
uv run python -m memory_profiler app/main.py

# Database query analysis
export DATABASE_ECHO=true  # Log all SQL queries
```

## 📚 Additional Resources

### Documentation
- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **Pydantic**: https://pydantic.dev/
- **Celery**: https://docs.celeryq.org/
- **UV**: https://docs.astral.sh/uv/
- **pytest**: https://docs.pytest.org/

### Learning Resources
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [SQLAlchemy Tutorial](https://docs.sqlalchemy.org/tutorial/)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)
- [Async Python](https://docs.python.org/3/library/asyncio.html)

### Community
- [FastAPI GitHub](https://github.com/tiangolo/fastapi)
- [FastAPI Discord](https://discord.gg/VQjSZaeJmf)
- [Python Discord](https://discord.gg/python)

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/algoassistant.git`
3. Install dependencies: `uv sync --group dev`
4. Create feature branch: `git checkout -b feature/amazing-feature`
5. Make changes and add tests
6. Run quality checks: `make quality`
7. Run tests: `make test`
8. Commit changes: `git commit -m 'Add amazing feature'`
9. Push to branch: `git push origin feature/amazing-feature`
10. Open a Pull Request

### Code Standards
- Follow PEP 8 style guidelines
- Add type hints to all functions
- Write docstrings for public APIs
- Maintain 80%+ test coverage
- Update documentation for API changes

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new functionality
4. Follow conventional commit messages
5. Request review from maintainers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- FastAPI team for the amazing framework
- SQLAlchemy team for the powerful ORM
- Astral team for the lightning-fast UV package manager
- All contributors who help improve this project

---

**Happy Coding! 🚀**

For more detailed information, check out:
- [Quick Start Guide](QUICK_START.md)
- [UV Package Manager Guide](README-UV.md)
- [API Documentation](http://localhost:8000/docs) (when running)
