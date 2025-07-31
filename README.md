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
- **PostgreSQL**: Primary database
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
- **PostgreSQL**: Data persistence
- **Redis**: Cache and task queue

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
# Start all services
docker-compose up

# Or start individual services
docker-compose up backend frontend
```

#### Production Mode
```bash
# Start all services in background
docker-compose up -d
```

### 4️⃣ Access Application

- **Frontend Interface**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## 📁 Project Structure

```
AlgoAssistant/
├── 📁 backend/                    # FastAPI backend
│   ├── 📁 app/
│   │   ├── 📁 api/               # API routes
│   │   │   ├── 📄 users.py       # User authentication
│   │   │   ├── 📄 records.py     # Solution records
│   │   │   ├── 📄 leetcode.py    # LeetCode integration
│   │   │   ├── 📄 notion.py      # Notion integration
│   │   │   ├── 📄 github.py      # GitHub integration
│   │   │   ├── 📄 google.py      # Google OAuth
│   │   │   ├── 📄 review.py      # Review system
│   │   │   ├── 📄 sync_task.py   # Sync tasks
│   │   │   ├── 📄 gemini.py      # AI analysis
│   │   │   └── 📄 dashboard.py   # Dashboard
│   │   ├── 📁 models/            # Database models
│   │   ├── 📁 schemas/           # Pydantic schemas
│   │   ├── 📁 services/          # Business logic
│   │   ├── 📁 tasks/             # Celery tasks
│   │   ├── 📁 utils/             # Utility functions
│   │   └── 📁 config/            # Configuration management
│   ├── 📁 tests/                 # Backend tests
│   ├── 📄 pyproject.toml         # Project configuration
│   ├── 📄 Dockerfile             # Docker configuration
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
│   └── 📄 README.md              # Frontend documentation
├── 📄 docker-compose.yml         # Docker orchestration
├── 📄 docker-compose.dev.yml     # Development environment
├── 📄 SETUP.md                   # Detailed setup guide
├── 📄 LICENSE                    # MIT license
└── 📄 README.md                  # Project documentation
```

## 🔌 API Overview

### 👤 User Authentication (8 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/register` | User registration | ❌ |
| POST | `/api/users/login` | User login | ❌ |
| GET | `/api/users/me` | Get current user | ✅ |
| PUT | `/api/users/user/profile` | Update user profile | ✅ |
| GET | `/api/users/config` | Get user config | ✅ |
| PUT | `/api/users/config` | Update user config | ✅ |

### 🔍 Google OAuth (5 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/google/auth` | Get auth URL | ✅ |
| GET | `/api/google/callback` | Handle OAuth callback | ❌ |
| POST | `/api/google/login` | Google token login | ❌ |
| GET | `/api/google/status` | Check connection status | ✅ |
| DELETE | `/api/google/disconnect` | Disconnect Google | ✅ |

### 📊 Problem Records (10 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/records/` | Get record list | ✅ |
| POST | `/api/records/` | Create new record | ✅ |
| GET | `/api/records/stats` | Get statistics | ✅ |
| GET | `/api/records/{id}` | Get specific record | ✅ |
| PUT | `/api/records/{id}` | Update record | ✅ |
| DELETE | `/api/records/{id}` | Delete record | ✅ |
| GET | `/api/records/tags` | Get all tags | ✅ |
| POST | `/api/records/{id}/tags` | Assign tags | ✅ |

### 🤖 AI Analysis (4 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/gemini/analyze` | Analyze code | ✅ |
| POST | `/api/gemini/analyze/batch` | Batch analysis | ✅ |
| GET | `/api/gemini/analysis/{id}` | Get analysis result | ✅ |
| GET | `/api/gemini/stats` | Get analysis stats | ✅ |

### 📚 Review System (4 endpoints)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/review/` | Create review task | ✅ |
| GET | `/api/review/` | Get review list | ✅ |
| GET | `/api/review/due` | Get due reviews | ✅ |
| POST | `/api/review/{id}/mark-reviewed` | Mark as reviewed | ✅ |

### 🔄 Platform Integration
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/leetcode/test-connection` | Test LeetCode connection | ✅ |
| GET | `/api/notion/test_connection` | Test Notion connection | ✅ |
| GET | `/api/github/test_connection` | Test GitHub connection | ✅ |

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

### 🌐 Production Deployment

1. **Update production environment variables**
2. **Set up SSL certificates**
3. **Configure reverse proxy (nginx)**
4. **Use production Docker images**

```bash
# Build and deploy
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend frontend
```

### 📊 Service Overview

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| Backend API | 8000 | FastAPI application |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache and message broker |
| Celery Worker | - | Background task processor |

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
