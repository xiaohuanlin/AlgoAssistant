# AlgoAssistant

A comprehensive algorithm practice management system with AI-powered analysis, multi-platform synchronization, and intelligent review features.

## ✨ Key Features

- **User Authentication**: Secure login/register system with JWT tokens
- **Google OAuth**: Google account login support
- **GitHub Integration**: Connect GitHub account for code synchronization
- **LeetCode Sync**: Automatic synchronization of LeetCode solution records
- **AI Code Analysis**: Gemini-powered code analysis with comprehensive insights
- **Markdown Rendering**: Rich text formatting for AI analysis results
- **Notion Integration**: Sync records to Notion database
- **Intelligent Review System**: Spaced repetition algorithm for wrong problems
- **Multi-language Support**: English and Chinese interface switching
- **Asynchronous Task Processing**: Background task handling with Celery
- **Docker Containerization**: Complete containerized deployment solution
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Google OAuth credentials
- GitHub OAuth credentials (optional)
- Gemini API key (optional)
- Notion API token (optional)

### 1. Clone the repository

```bash
git clone <repository-url>
cd AlgoAssistant
```

### 2. Configure environment variables

**⚠️ IMPORTANT: Never commit `.env` files containing real credentials to the repository!**

```bash
# Copy environment variable templates
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Edit files with actual credentials
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

📖 **For detailed setup instructions, see [SETUP.md](SETUP.md)**

### 3. Start the application

#### Development mode (with hot reload)

```bash
# Start all services
docker-compose up

# Or start individual services
docker-compose up backend
docker-compose up frontend
```

#### Production mode

```bash
# Start all services in background
docker-compose up -d
```

### 4. Access the application

- Frontend Interface: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🏗️ Technical Architecture

### Backend Technology Stack

- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: ORM database operations
- **PostgreSQL**: Primary database
- **Redis**: Caching and message queue
- **Celery**: Asynchronous task processing
- **Alembic**: Database migrations
- **JWT**: User authentication
- **Gemini API**: AI-powered code analysis

### Frontend Technology Stack

- **React 18**: User interface framework with hooks
- **Ant Design**: UI component library
- **React Router**: Route management
- **Axios**: HTTP client
- **i18next**: Internationalization support
- **React Syntax Highlighter**: Code highlighting
- **React Markdown**: Markdown rendering for AI analysis
- **CSS Modules**: Component-specific styling

### Infrastructure

- **Docker**: Containerized deployment
- **Docker Compose**: Multi-service orchestration
- **PostgreSQL**: Data persistence
- **Redis**: Caching and task queue

## 📁 Project Structure

```
AlgoAssistant/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API Routes
│   │   │   ├── users.py    # User Authentication
│   │   │   ├── records.py  # Solution Records
│   │   │   ├── leetcode.py # LeetCode Integration
│   │   │   ├── notion.py   # Notion Integration
│   │   │   ├── github.py   # GitHub Integration
│   │   │   ├── google.py   # Google OAuth
│   │   │   ├── review.py   # Review System
│   │   │   ├── sync_task.py # Sync Tasks
│   │   │   └── ai_analysis.py # AI Analysis
│   │   ├── models.py       # Database Models
│   │   ├── services/       # Business Logic
│   │   ├── tasks/          # Celery Tasks
│   │   ├── utils/          # Utility Functions
│   │   └── config/         # Configuration Management
│   ├── tests/              # Backend Tests
│   └── requirements.txt    # Python Dependencies
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React Components
│   │   │   ├── AIAnalysisCard.jsx # AI Analysis Component
│   │   │   └── ...         # Other Components
│   │   ├── pages/          # Page Components
│   │   ├── services/       # API Services
│   │   ├── contexts/       # React Contexts
│   │   ├── hooks/          # Custom Hooks
│   │   ├── styles/         # Style Files
│   │   └── i18n/           # Internationalization
│   └── package.json        # Node.js Dependencies
├── docker-compose.yml      # Docker Orchestration
├── SETUP.md               # Detailed Configuration Guide
└── README.md              # Project Documentation
```

## 🔌 API Endpoints

### User Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/google/login` - Google OAuth login
- `GET /api/me` - Get current user info

### Google OAuth
- `GET /api/google/auth` - Get Google auth URL
- `GET /api/google/callback` - Handle OAuth callback
- `GET /api/google/status` - Check connection status
- `DELETE /api/google/disconnect` - Disconnect Google

### Problem Records
- `GET /api/records` - Get user records
- `POST /api/records` - Create new record
- `PUT /api/records/{id}` - Update record
- `DELETE /api/records/{id}` - Delete record
- `GET /api/records/{id}` - Get record details

### AI Analysis
- `POST /api/ai/analyze` - Analyze code with AI
- `POST /api/ai/analyze/batch` - Batch AI analysis
- `GET /api/ai/status/{recordId}` - Get analysis status
- `GET /api/ai/stats` - Get analysis statistics

### LeetCode Integration
- `POST /api/leetcode/sync` - Sync LeetCode records
- `GET /api/leetcode/status` - Check sync status

### GitHub Integration
- `POST /api/github/sync` - Sync GitHub code
- `GET /api/github/status` - Check connection status

### Notion Integration
- `POST /api/notion/sync` - Sync to Notion
- `GET /api/notion/status` - Check connection status

### Review System
- `GET /api/review/today` - Get today's review problems
- `POST /api/review/update` - Update review status

### Sync Tasks
- `GET /api/sync-tasks` - Get sync tasks
- `POST /api/sync-tasks` - Create sync task
- `DELETE /api/sync-tasks/{id}` - Delete sync task

## 🧠 AI Analysis Features

### Comprehensive Code Analysis
- **Algorithm Type Detection**: Identifies algorithm categories (DFS, DP, Greedy, etc.)
- **Complexity Analysis**: Time and space complexity evaluation
- **Code Quality Scoring**: Quality and style assessment (1-10 scale)
- **Correctness Confidence**: AI confidence level in solution correctness
- **Step-by-step Analysis**: Detailed breakdown of solution logic
- **Improvement Suggestions**: Code optimization recommendations
- **Edge Cases Coverage**: Identified boundary conditions
- **Risk Areas**: Potential problem areas in the code
- **Learning Points**: Key takeaways and concepts
- **Related Problems**: Similar problems for practice

### Markdown Rendering
- **Rich Text Formatting**: Support for headers, lists, code blocks
- **Syntax Highlighting**: Code snippets with language-specific highlighting
- **Responsive Layout**: Adaptive design for different screen sizes
- **Collapsible Sections**: Organized information display with expandable panels

## 🎨 UI/UX Features

### Modern Interface Design
- **Ant Design Components**: Professional and consistent UI
- **Responsive Layout**: Mobile-first design approach
- **Dark/Light Theme**: Theme switching capability
- **Loading States**: Smooth loading animations
- **Error Handling**: User-friendly error messages

### Component Architecture
- **Modular Components**: Reusable and maintainable code
- **Custom Hooks**: Shared logic and state management
- **Context API**: Global state management
- **CSS Modules**: Scoped styling for components

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Build test
cd frontend
npm run build
```

## 🔒 Security Considerations

### Environment Variables

- **Never commit `.env` files** containing real credentials
- Use `.env.example` files as templates
- Configure environment variables securely in production
- Each developer should create their own OAuth clients

### Best Practices

- Use strong, unique secrets for each environment
- Rotate credentials regularly
- Use environment-specific configurations
- Monitor for unauthorized access
- Validate all user inputs
- Implement proper CORS policies

## 🚀 Deployment

### Production Deployment

1. Update environment variables for production
2. Set up SSL certificates
3. Configure reverse proxy (nginx)
4. Use production Docker images

```bash
# Build and deploy
docker-compose up -d
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SECRET_KEY` | JWT secret key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `REACT_APP_GOOGLE_CLIENT_ID` | Frontend Google client ID | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | No |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | No |
| `GEMINI_API_KEY` | Gemini API key for AI analysis | No |
| `NOTION_TOKEN` | Notion API token | No |
| `NOTION_DATABASE_ID` | Notion database ID | No |

## 🔄 Recent Updates

### v2.0.0 - AI Analysis Enhancement
- ✨ **Enhanced AI Analysis**: Comprehensive code analysis with Gemini AI
- 📝 **Markdown Rendering**: Rich text formatting for analysis results
- 🎨 **Improved UI**: Modern component design with better UX
- 📱 **Responsive Design**: Mobile-friendly interface
- 🔧 **Code Refactoring**: Modular component architecture
- 🌐 **Internationalization**: Full English/Chinese support

### Key Improvements
- **AIAnalysisCard Component**: Dedicated component for AI analysis display
- **Collapsible Sections**: Organized information with expandable panels
- **Progress Indicators**: Visual representation of scores and confidence
- **Color-coded Categories**: Visual distinction between different analysis types
- **Left-aligned Layout**: Improved readability and consistency

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines
- Follow React best practices and hooks
- Use TypeScript for type safety
- Maintain responsive design
- Add proper error handling
- Write comprehensive tests
- Update documentation

## 📄 License

This project is licensed under the MIT License.
