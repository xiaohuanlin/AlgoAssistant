# 🚀 AlgoAssistant

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-00a393.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://docker.com/)

A comprehensive algorithm practice management system with AI analysis, multi-platform synchronization, and intelligent review features.

## ✨ Core Features

### 🎯 Algorithm Practice Management
- 📊 **Smart Dashboard**: Real-time statistics, progress tracking, and performance visualization
- 📝 **Problem Management**: Create, edit, and organize algorithm problems with multiple programming languages
- 📈 **Submission Records**: Track submission history with execution results and performance metrics
- 🔄 **Intelligent Review System**: Spaced repetition algorithm based on forgetting curve

### 🤖 AI-Powered Analysis
- 🧠 **Gemini AI Analysis**: Automatic code analysis with complexity assessment and optimization suggestions
- 📋 **Comprehensive Reports**: Algorithm type identification, code quality scoring, and improvement recommendations
- 💡 **Learning Insights**: Step analysis, edge case identification, and related problem recommendations
- 📊 **Batch Analysis**: Support for bulk AI analysis of multiple submissions

### 🔗 Multi-Platform Integration
- 💻 **LeetCode Sync**: Automatic synchronization of LeetCode solution records
- 🐙 **GitHub Integration**: Code synchronization to GitHub repositories
- 📔 **Notion Integration**: Sync records to Notion databases
- 🔐 **Google OAuth**: Support for Google account login

### 🌐 Modern Interface
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- 🌍 **Internationalization**: Chinese and English interface switching
- 🎨 **Modern UI**: Beautiful interface based on Ant Design 5.x
- ⚡ **Real-time Updates**: Live sync status and notifications

## 🏗️ Technical Architecture

### Backend Technology Stack
- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: ORM database operations
- **PostgreSQL/SQLite**: Primary database (SQLite for mini deployment)
- **Redis**: Cache and message queue
- **Celery**: Asynchronous task processing
- **JWT**: User authentication
- **UV**: Ultra-fast Python package manager

### Frontend Technology Stack
- **React 18**: Modern UI framework
- **Ant Design 5.x**: Enterprise-class UI component library
- **React Router v6**: Route management
- **Axios**: HTTP client
- **i18next**: Internationalization support
- **Monaco Editor**: Code editor

### Infrastructure
- **Docker**: Containerized deployment
- **Docker Compose**: Multi-service orchestration
- **PostgreSQL/SQLite**: Data persistence (flexible database options)
- **Redis**: Cache and task queue
- **Nginx**: Static file serving and reverse proxy

## 🚀 Quick Start

### 📋 Prerequisites

- **Docker** >= 20.0
- **Docker Compose** >= 2.0
- **Google OAuth** credentials (required)
- **GitHub OAuth** credentials (optional)
- **Gemini API key** (optional, for AI analysis)
- **Notion API token** (optional)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-org/AlgoAssistant.git
cd AlgoAssistant
```

### 2️⃣ Environment Configuration

**⚠️ Important: Never commit `.env` files containing real credentials to the repository!**

```bash
# Copy environment variable templates
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Edit files and fill in real credentials
# See SETUP.md for detailed configuration instructions
```

#### Required Configuration

1. **Google OAuth Setup**:
   - Create OAuth 2.0 client in [Google Cloud Console](https://console.cloud.google.com/)
   - Add test users in OAuth consent screen
   - Update credentials in `frontend/.env` and `backend/.env`

2. **Environment Variables**:
   ```env
   # Frontend (.env)
   REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

   # Backend (.env)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

📖 **For detailed installation instructions, see [SETUP.md](SETUP.md)**

### 3️⃣ Start Application

#### Development Mode (Hot Reload)
```bash
# Start all services (full PostgreSQL setup)
docker-compose up

# Or start individual services
docker-compose up backend frontend
```

#### Production Mode
```bash
# Full deployment (recommended for development)
docker-compose up -d

# Mini deployment (lightweight, 1GB RAM)
docker-compose -f docker-compose.mini.yml up -d
```

#### 🚀 Mini Deployment (Resource-Optimized)
For servers with limited resources (1GB RAM), use the mini configuration:

```bash
# Start mini deployment
docker-compose -f docker-compose.mini.yml up -d --build

# Check status
docker-compose -f docker-compose.mini.yml ps

# View logs
docker-compose -f docker-compose.mini.yml logs -f
```

**Mini deployment features:**
- **SQLite** instead of PostgreSQL (saves ~200MB RAM)
- **Lightweight Redis** with memory limits
- **Optimized resource limits** for each service
- **Single-worker Celery** configuration
- **Nginx** for static file serving

### 4️⃣ Access Application

#### Full Deployment
- **Frontend Interface**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

#### Mini Deployment
- **Frontend Interface**: http://localhost:80 (or your-domain.com)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## 📁 Project Structure

```
AlgoAssistant/
├── 📁 backend/                    # FastAPI backend
│   ├── 📁 app/
│   │   ├── 📁 api/               # API routes
│   │   │   ├── 📄 users.py       # User authentication & profiles
│   │   │   ├── 📄 records.py     # Solution records
│   │   │   ├── 📄 problem.py     # Problem bank management
│   │   │   ├── 📄 leetcode.py    # LeetCode integration
│   │   │   ├── 📄 notion.py      # Notion integration
│   │   │   ├── 📄 github.py      # GitHub integration
│   │   │   ├── 📄 google.py      # Google OAuth
│   │   │   ├── 📄 review.py      # Review system
│   │   │   ├── 📄 sync_task.py   # Sync tasks
│   │   │   ├── 📄 gemini.py      # AI analysis
│   │   │   └── 📄 dashboard.py   # Dashboard analytics
│   │   ├── 📄 models.py          # Database models
│   │   ├── 📁 schemas/           # Pydantic schemas
│   │   │   ├── 📁 enums/         # Enumeration schemas
│   │   │   ├── 📄 problem.py     # Problem schemas
│   │   │   ├── 📄 record.py      # Record schemas
│   │   │   ├── 📄 notification.py # Notification schemas
│   │   │   └── 📄 ...            # Other schema files
│   │   ├── 📁 services/          # Business logic
│   │   │   ├── 📄 base_*.py      # Base service classes
│   │   │   ├── 📄 problem_service.py # Problem management
│   │   │   ├── 📄 dashboard_service.py # Dashboard data
│   │   │   ├── 📄 email_service.py # Email notifications
│   │   │   └── 📄 ...            # Other service files
│   │   ├── 📁 tasks/             # Celery tasks
│   │   │   ├── 📄 leetcode_batch_sync.py # Batch synchronization
│   │   │   ├── 📄 review_notification.py # Review reminders
│   │   │   ├── 📄 task_manager.py # Task coordination
│   │   │   └── 📄 ...            # Other task files
│   │   ├── 📁 utils/             # Utility functions
│   │   │   ├── 📄 logger.py      # Logging utilities
│   │   │   ├── 📄 security.py    # Security functions
│   │   │   └── 📄 rate_limiter.py # Rate limiting
│   │   └── 📁 config/            # Configuration management
│   │       ├── 📄 settings.py    # Application settings
│   │       └── 📄 sqlite_config.py # SQLite optimizations
│   ├── 📁 tests/                 # Backend tests
│   ├── 📄 pyproject.toml         # Project configuration
│   ├── 📄 Dockerfile             # Docker configuration
│   ├── 📄 Dockerfile.mini        # Mini deployment Docker
│   └── 📄 README.md              # Backend documentation
├── 📁 frontend/                   # React frontend
│   ├── 📁 src/
│   │   ├── 📁 components/        # React components
│   │   │   ├── 📁 common/        # Common components
│   │   │   ├── 📁 dashboard/     # Dashboard components
│   │   │   ├── 📁 auth/          # Auth components
│   │   │   └── 📁 ui/            # UI components
│   │   ├── 📁 pages/             # Page components
│   │   ├── 📁 services/          # API services
│   │   ├── 📁 contexts/          # React contexts
│   │   ├── 📁 hooks/             # Custom hooks
│   │   ├── 📁 styles/            # Style files
│   │   └── 📁 i18n/              # Internationalization
│   ├── 📄 package.json           # Node.js dependencies
│   ├── 📄 Dockerfile             # Docker configuration
│   ├── 📄 Dockerfile.mini        # Mini deployment Docker
│   ├── 📄 nginx.conf             # Nginx configuration (full)
│   ├── 📄 nginx.mini.conf        # Nginx configuration (mini)
│   └── 📄 README.md              # Frontend documentation
├── 📄 docker-compose.yml         # Docker orchestration (full)
├── 📄 docker-compose.dev.yml     # Development environment
├── 📄 docker-compose.mini.yml    # Mini deployment (resource-optimized)
├── 📄 deploy-mini.sh             # Mini deployment script
├── 📄 DEPLOY_MINI.md             # Mini deployment guide
├── 📄 SETUP.md                   # Detailed setup guide
├── 📄 LICENSE                    # MIT license
└── 📄 README.md                  # Project documentation
```

## 🔌 API Overview

### 👤 User Management (13 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/register` | User registration | ❌ |
| POST | `/api/users/login` | User login | ❌ |
| GET | `/api/users/me` | Get current user | ✅ |
| GET | `/api/users/auth-type` | Get authentication type | ✅ |
| GET | `/api/users/user/profile` | Get user profile | ✅ |
| PUT | `/api/users/user/profile` | Update user profile | ✅ |
| POST | `/api/users/change-password` | Change password | ✅ |
| POST | `/api/users/set-password` | Set password (OAuth users) | ✅ |
| POST | `/api/users/upload-avatar` | Upload avatar image | ✅ |
| POST | `/api/users/config` | Create user config | ✅ |
| GET | `/api/users/config` | Get user config | ✅ |
| PUT | `/api/users/config` | Update user config | ✅ |
| POST | `/api/users/trigger-notifications` | Test notifications | ✅ |

### 🔍 Google OAuth (5 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/google/auth` | Get auth URL | ✅ |
| GET | `/api/google/callback` | Handle OAuth callback | ❌ |
| POST | `/api/google/login` | Google token login | ❌ |
| GET | `/api/google/status` | Check connection status | ✅ |
| DELETE | `/api/google/disconnect` | Disconnect Google | ✅ |

### 📊 Solution Records (9 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/records/` | Create new record | ✅ |
| GET | `/api/records/` | Get record list with filters | ✅ |
| GET | `/api/records/stats` | Get statistics | ✅ |
| GET | `/api/records/{id}` | Get specific record | ✅ |
| PUT | `/api/records/{id}` | Update record | ✅ |
| DELETE | `/api/records/{id}` | Delete record | ✅ |
| GET | `/api/records/tags` | Get all tags | ✅ |
| POST | `/api/records/{id}/tags` | Assign tags to record | ✅ |
| PUT | `/api/records/tags/{tag_id}/wiki` | Update tag wiki | ✅ |

### 🧩 Problem Bank (9 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/problem/` | Create new problem | ✅ |
| POST | `/api/problem/import` | Import problems from text | ✅ |
| GET | `/api/problem/stats` | Get problem bank statistics | ✅ |
| GET | `/api/problem/{problem_id}` | Get specific problem | ✅ |
| GET | `/api/problem/{problem_id}/user-records` | Get user records for problem | ✅ |
| GET | `/api/problem/{problem_id}/statistics` | Get problem statistics | ✅ |
| PUT | `/api/problem/{problem_id}` | Update problem | ✅ |
| DELETE | `/api/problem/{problem_id}` | Delete problem | ✅ |
| GET | `/api/problem/` | Get problem list | ✅ |

### 🤖 AI Analysis (3 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/gemini/profile` | Get AI analysis stats | ✅ |
| POST | `/api/gemini/test-connection` | Test Gemini connection | ✅ |

### 📚 Review System (12 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/review/` | Create review task | ✅ |
| GET | `/api/review/` | Get review list | ✅ |
| GET | `/api/review/due` | Get due reviews | ✅ |
| GET | `/api/review/filter` | Get filtered reviews | ✅ |
| POST | `/api/review/batch-update` | Batch update reviews | ✅ |
| POST | `/api/review/batch-delete` | Batch delete reviews | ✅ |
| POST | `/api/review/delete-all` | Delete all reviews | ✅ |
| POST | `/api/review/batch-mark-reviewed` | Batch mark as reviewed | ✅ |
| GET | `/api/review/stats` | Get review statistics | ✅ |
| GET | `/api/review/{review_id}` | Get specific review | ✅ |
| POST | `/api/review/{review_id}/mark-reviewed` | Mark as reviewed | ✅ |

### 📈 Dashboard Analytics (6 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard/stats/basic` | Get basic statistics | ✅ |
| GET | `/api/dashboard/stats/categories` | Get category statistics | ✅ |
| GET | `/api/dashboard/activity/recent` | Get recent activity | ✅ |
| GET | `/api/dashboard/errors/analysis` | Get error analysis | ✅ |
| GET | `/api/dashboard/progress/trend` | Get progress trends | ✅ |
| GET | `/api/dashboard/overview` | Get dashboard overview | ✅ |

### 🔄 Sync Tasks (9 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/sync_task/` | Create sync task | ✅ |
| GET | `/api/sync_task/` | Get sync task list | ✅ |
| GET | `/api/sync_task/stats` | Get sync statistics | ✅ |
| GET | `/api/sync_task/{task_id}` | Get specific task | ✅ |
| DELETE | `/api/sync_task/{task_id}` | Delete sync task | ✅ |
| POST | `/api/sync_task/{task_id}/pause` | Pause sync task | ✅ |
| POST | `/api/sync_task/{task_id}/resume` | Resume sync task | ✅ |
| POST | `/api/sync_task/{task_id}/retry` | Retry sync task | ✅ |
| GET | `/api/sync_task/{task_id}/review-candidates` | Get review candidates | ✅ |

### 💻 LeetCode Integration (3 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/leetcode/test-connection` | Test LeetCode connection | ✅ |
| GET | `/api/leetcode/profile` | Get LeetCode profile | ✅ |

### 🔗 Other Platform Integration (3 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notion/test_connection` | Test Notion connection | ✅ |
| GET | `/api/github/test_connection` | Test GitHub connection | ✅ |

### 🌐 System Endpoints (3 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API welcome message | ❌ |
| GET | `/health` | Health check endpoint | ❌ |
| GET | `/uploads/{file_path}` | Static file serving | ❌ |

## 🧠 AI Analysis Features

### 📈 Comprehensive Code Analysis
- **Algorithm Type Detection**: Identify algorithm categories (DFS, DP, Greedy, etc.)
- **Complexity Analysis**: Time and space complexity assessment
- **Code Quality Scoring**: Quality and style evaluation (1-10 score)
- **Correctness Confidence**: AI confidence level in solution correctness
- **Step Analysis**: Detailed breakdown of solution logic
- **Improvement Suggestions**: Code optimization recommendations
- **Edge Case Coverage**: Identified boundary conditions
- **Risk Areas**: Potential problem areas in code
- **Learning Points**: Key takeaways and concepts
- **Related Problems**: Similar problem recommendations

### 📝 Markdown Rendering
- **Rich Text Format**: Support for headers, lists, code blocks
- **Syntax Highlighting**: Language-specific code snippet highlighting
- **Responsive Layout**: Adapts to different screen sizes
- **Collapsible Sections**: Organized information display

## 🎨 UI/UX Features

### 🖥️ Modern Interface Design
- **Ant Design Components**: Professional and consistent UI
- **Responsive Layout**: Mobile-first design
- **Theme Switching**: Dark/light theme support
- **Loading States**: Smooth loading animations
- **Error Handling**: User-friendly error messages

### 🧩 Component Architecture
- **Modular Components**: Reusable and maintainable code
- **Custom Hooks**: Shared logic and state management
- **Context API**: Global state management
- **CSS Modules**: Component-scoped styling

## 🛠️ Available Scripts

### 🐳 Docker Commands
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build
```

### 🔧 Development Commands
```bash
# Backend
cd backend
make install-dev          # Install dev dependencies
make run                  # Start dev server
make test                 # Run tests
make lint                 # Code linting
make format              # Code formatting

# Frontend
cd frontend
npm install              # Install dependencies
npm start               # Start dev server
npm test                # Run tests
npm run build           # Build for production
npm run lint            # ESLint check
npm run format          # Prettier formatting
```

## 🧪 Testing

### 🔧 Backend Testing
```bash
cd backend
# Run all tests
make test

# Run specific tests
uv run pytest tests/test_api_users.py

# Run coverage tests
make test-cov
```

### ⚛️ Frontend Testing
```bash
cd frontend
# Run all tests
npm test

# Run specific tests
npm test -- --testNamePattern="Auth"

# Build test
npm run build
```

## 🔒 Security Considerations

### 🔐 Environment Variables
- **Never commit** `.env` files containing real credentials
- Use `.env.example` files as templates
- Configure environment variables securely in production
- Each developer should create their own OAuth clients

### 🛡️ Best Practices
- Use strong, unique keys for each environment
- Rotate credentials regularly
- Use environment-specific configurations
- Monitor for unauthorized access
- Validate all user inputs
- Implement proper CORS policies

## 🚀 Deployment

### 🌐 Production Deployment Options

#### Option 1: Full Deployment (Recommended for Development)
```bash
# Build and deploy with PostgreSQL
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend frontend
```

#### Option 2: Mini Deployment (Production/Low-Resource Servers)
For production servers with limited resources (1GB RAM):

```bash
# 1. Create production environment file
cp backend/.env.example .env.production

# 2. Update critical settings
cat > .env.production << EOF
SECRET_KEY=$(openssl rand -hex 32)
FERNET_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
DATABASE_URL=sqlite:////app/data/algo_assistant.db
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=["http://your-domain.com","https://your-domain.com"]
EOF

# 3. Deploy mini configuration
docker-compose -f docker-compose.mini.yml up -d --build

# 4. Check status
docker-compose -f docker-compose.mini.yml ps
```

### 🔒 Production Security Checklist

#### Required Steps
1. **Environment Variables**: Generate secure keys and update CORS origins
2. **SSL Certificate**: Configure HTTPS for production domains
3. **Database**: Set up database backups and monitoring
4. **Monitoring**: Set up logging and alerting

#### Optional Steps
5. **External Services**: Configure OAuth providers and API keys
6. **Email**: Set up SMTP for notifications
7. **Domain**: Configure custom domain and DNS

### 📊 Service Overview

#### Full Deployment
| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| Backend API | 8000 | FastAPI application |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache and message broker |
| Celery Worker | - | Background task processor |

#### Mini Deployment
| Service | Port | Description | Memory Limit |
|---------|------|-------------|--------------|
| Frontend (Nginx) | 80 | Static files + reverse proxy | 512MB |
| Backend API | 8000 | FastAPI application | 400MB |
| SQLite | - | File database | N/A |
| Redis | 6379 | Cache and message broker | 64MB |
| Celery Worker | - | Background task processor | 200MB |
| Celery Beat | - | Task scheduler | 100MB |

## 📊 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SECRET_KEY` | JWT secret key | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ |
| `REACT_APP_GOOGLE_CLIENT_ID` | Frontend Google client ID | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | ❌ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | ❌ |
| `GEMINI_API_KEY` | Gemini API key | ❌ |
| `NOTION_TOKEN` | Notion API token | ❌ |

## 🤝 Contributing

### 🛠️ Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/AlgoAssistant.git`
3. Install dependencies: see installation instructions above
4. Create feature branch: `git checkout -b feature/amazing-feature`
5. Make changes and add tests
6. Run quality checks: `make quality` (backend) or `npm run lint` (frontend)
7. Run tests: `make test` (backend) or `npm test` (frontend)
8. Commit changes: `git commit -m 'Add amazing feature'`
9. Push to branch: `git push origin feature/amazing-feature`
10. Open Pull Request

### 📝 Code Standards
- Follow PEP 8 style guide (Python)
- Use ESLint and Prettier (JavaScript/React)
- Add type hints for all functions (Python)
- Write docstrings for public APIs
- Maintain 80%+ test coverage
- Update documentation for API changes

### 🔄 Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new features
4. Follow conventional commit messages
5. Request review from maintainers

## 🔧 Troubleshooting

### Common Issues

#### 1. **Docker Issues**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild containers
docker-compose down
docker-compose up --build
```

#### 2. **Port in Use**
```bash
# Find process using port
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

#### 3. **Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x scripts/*
```

### 🐛 Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# View detailed logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📚 Related Resources

### 📖 Documentation
- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://reactjs.org/
- **Ant Design**: https://ant.design/
- **Docker**: https://docs.docker.com/
- **PostgreSQL**: https://www.postgresql.org/docs/

### 🎓 Learning Resources
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [React Tutorial](https://reactjs.org/tutorial/tutorial.html)
- [Docker Tutorial](https://docs.docker.com/get-started/)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- FastAPI team for the excellent framework
- React team for the powerful UI library
- Ant Design team for the beautiful components
- All contributors who help improve this project

---

**Happy Coding! 🚀**

For more detailed information, check out:
- [Detailed Setup Guide](SETUP.md)
- [Backend Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [API Documentation](http://localhost:8000/docs) (when running)
