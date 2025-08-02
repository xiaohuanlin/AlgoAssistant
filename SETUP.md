# 🔧 AlgoAssistant Setup Guide

This guide provides detailed instructions for setting up the AlgoAssistant development environment and configuring all required services.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Docker** >= 20.0
- **Docker Compose** >= 2.0
- **Git** for version control
- A Google account for OAuth setup
- (Optional) GitHub, Notion, and Gemini API accounts

## 🚀 Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/your-org/AlgoAssistant.git
cd AlgoAssistant
```

### 2. Environment Variable Setup

**⚠️ CRITICAL: Never commit `.env` files containing real credentials to version control!**

#### Copy Environment Templates

```bash
# Frontend environment variables
cp frontend/.env.example frontend/.env

# Backend environment variables
cp backend/.env.example backend/.env
```

#### Verify Template Files

Check that you have these template files:

```bash
ls -la frontend/.env.example
ls -la backend/.env.example
```

## 🔐 Required Configuration

### Google OAuth Setup (Required)

Google OAuth is required for user authentication. Follow these steps carefully:

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "AlgoAssistant-Dev")
4. Click "Create"

#### Step 2: Enable Required APIs

1. Go to "APIs & Services" → "Library"
2. Search for and enable:
   - **Google+ API** (for user profile access)
   - **People API** (for user information)

#### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in application information:
   - **App name**: AlgoAssistant
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Save and continue through all steps
5. **Important**: Add your email address in "Test users" section

#### Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application" as application type
4. Configure **Authorized redirect URIs**:
   ```
   http://localhost:3000
   http://localhost:8000/api/google/callback
   ```
5. Click "Create"
6. **Save the Client ID and Client Secret** - you'll need these!

#### Step 5: Update Environment Variables

Edit `frontend/.env`:
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
REACT_APP_ENV=development
```

Edit `backend/.env`:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/algo_assistant

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret

# Redis
REDIS_URL=redis://redis:6379/0

# Environment
ENVIRONMENT=development
LOG_LEVEL=DEBUG
```

## 🔧 Optional Configurations

### GitHub Integration (Optional)

To enable GitHub repository synchronization:

#### Setup GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in details:
   - **Application name**: AlgoAssistant
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:8000/api/github/callback
4. Click "Register application"
5. Note the Client ID and generate a Client Secret

#### Update Environment Variables

Add to `backend/.env`:
```env
# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Notion Integration (Optional)

To enable Notion database synchronization:

#### Create Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Fill in basic information:
   - **Name**: AlgoAssistant
   - **Associated workspace**: Your workspace
4. Click "Submit"
5. Copy the "Internal Integration Token"

#### Setup Notion Database

1. Create a new database in Notion
2. Add the integration to the database:
   - Click "..." → "Add connections" → Select your integration
3. Copy the database ID from the URL

#### Update Environment Variables

Add to `backend/.env`:
```env
# Notion Integration (Optional)
NOTION_TOKEN=your-notion-integration-token
NOTION_DATABASE_ID=your-notion-database-id
```

### Gemini AI Integration (Optional)

To enable AI code analysis:

#### Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API key"
3. Select your Google Cloud project
4. Copy the generated API key

#### Update Environment Variables

Add to `backend/.env`:
```env
# Gemini AI (Optional)
GEMINI_API_KEY=your-gemini-api-key
```

## 🐳 Start the Application

### Method 1: Docker Compose (Recommended)

Start all services with hot reload:

```bash
# Start all services
docker-compose up

# Or start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Method 2: Development Mode

For development with file watching:

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up

# Or start specific services
docker-compose up postgres redis backend frontend
```

## 🔍 Verify Installation

### 1. Check Service Status

```bash
# Check running containers
docker-compose ps

# Should show all services as "Up"
```

### 2. Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 3. Test Authentication

1. Open http://localhost:3000
2. Click "Login with Google"
3. Complete OAuth flow
4. Verify you can access the dashboard

### 4. Check Service Health

Visit http://localhost:8000/health to verify backend is running correctly.

## 🛠️ Development Workflow

### Backend Development

```bash
# Enter backend directory
cd backend

# Install dependencies (if not using Docker)
make install-dev

# Run tests
make test

# Run linting
make lint

# Format code
make format
```

### Frontend Development

```bash
# Enter frontend directory
cd frontend

# Install dependencies (if not using Docker)
npm install

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid Client" Error

**Symptoms**: Google OAuth returns "invalid_client" error

**Solutions**:
1. Verify Client ID is correct in both frontend and backend `.env` files
2. Check that redirect URIs in Google Console match exactly:
   - `http://localhost:3000` (not `https://`)
   - `http://localhost:8000/api/google/callback`
3. Ensure your email is added as a test user in OAuth consent screen
4. Clear browser cache and cookies

### Issue 2: Environment Variables Not Loading

**Symptoms**: Application can't find environment variables

**Solutions**:
1. Verify `.env` files exist in correct locations:
   - `frontend/.env`
   - `backend/.env`
2. Check file permissions:
   ```bash
   chmod 644 frontend/.env
   chmod 644 backend/.env
   ```
3. Restart Docker containers:
   ```bash
   docker-compose down
   docker-compose up
   ```
4. Verify variable names (frontend needs `REACT_APP_` prefix)

### Issue 3: Port Already in Use

**Symptoms**: "Port 3000/8000 is already in use" error

**Solutions**:
```bash
# Find and kill processes using ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Or use different ports in docker-compose.yml
```

### Issue 4: Docker Permission Issues

**Symptoms**: Permission denied errors with Docker

**Solutions**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Fix file ownership
sudo chown -R $USER:$USER .

# Restart terminal or run
newgrp docker
```

### Issue 5: Database Connection Issues

**Symptoms**: Backend can't connect to PostgreSQL

**Solutions**:
1. Verify PostgreSQL container is running:
   ```bash
   docker-compose ps postgres
   ```
2. Check database URL in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/algo_assistant
   ```
3. Reset database:
   ```bash
   docker-compose down
   docker volume rm algoassistant_postgres_data
   docker-compose up
   ```

### Issue 6: Frontend Build Issues

**Symptoms**: Frontend container fails to build or start

**Solutions**:
1. Clear npm cache:
   ```bash
   docker-compose down
   docker system prune -a
   docker-compose up --build
   ```
2. Check Node.js version compatibility in `frontend/package.json`
3. Verify all environment variables are set correctly

## 🔒 Security Best Practices

### Environment Variables

1. **Never commit** `.env` files to version control
2. Use different OAuth clients for development/staging/production
3. Generate strong, unique secrets for each environment
4. Rotate credentials regularly

### Development Security

1. **Use HTTPS in production** - Update redirect URIs accordingly
2. **Restrict OAuth scopes** - Only request necessary permissions
3. **Implement rate limiting** - Already configured in backend
4. **Validate all inputs** - Use Pydantic schemas
5. **Monitor for vulnerabilities** - Run security scans regularly

## 🚢 Production Deployment

### Environment Preparation

1. **Create production OAuth clients** with production domain URLs
2. **Set up SSL certificates** (Let's Encrypt recommended)
3. **Configure production database** (managed PostgreSQL service)
4. **Set up monitoring and logging**

### Environment Variables for Production

```env
# Production backend .env
DATABASE_URL=postgresql://user:password@prod-db:5432/algoassistant
SECRET_KEY=very-strong-production-secret-key
GOOGLE_CLIENT_ID=prod-google-client-id
GOOGLE_CLIENT_SECRET=prod-google-client-secret
REDIS_URL=redis://prod-redis:6379/0
ENVIRONMENT=production
LOG_LEVEL=INFO
```

```env
# Production frontend .env
REACT_APP_API_BASE_URL=https://api.yourdomain.com
REACT_APP_GOOGLE_CLIENT_ID=prod-google-client-id.apps.googleusercontent.com
REACT_APP_ENV=production
```

### Deployment Checklist

- [ ] Domain and SSL certificates configured
- [ ] Production OAuth clients created with correct redirect URIs
- [ ] Database and Redis services set up
- [ ] Environment variables configured securely
- [ ] Monitoring and logging enabled
- [ ] Backup strategy implemented
- [ ] Performance testing completed
- [ ] Security audit performed

## 🤝 Team Development

### For New Team Members

1. **Clone repository** and follow setup instructions
2. **Create personal Google OAuth client** (don't share credentials)
3. **Set up individual development environment**
4. **Test authentication flow** before starting development
5. **Follow code standards** and contribution guidelines

### Shared Resources

- Use shared development database if needed
- Document any configuration changes
- Update `.env.example` files when adding new variables
- Maintain synchronization of database schemas

## 📚 Additional Resources

### Documentation Links

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/)

### Troubleshooting Resources

- [Docker Troubleshooting Guide](https://docs.docker.com/engine/troubleshooting/)
- [Google OAuth Troubleshooting](https://developers.google.com/identity/oauth2/web/guides/troubleshooting)
- [PostgreSQL Common Issues](https://www.postgresql.org/docs/current/appendix-problems.html)

## 🆘 Getting Help

If you encounter issues not covered in this guide:

1. **Check existing issues** in the GitHub repository
2. **Search documentation** for your specific error message
3. **Create detailed issue report** with:
   - Operating system and versions
   - Exact error messages
   - Steps to reproduce
   - Environment configuration (without secrets)

---

**Setup Complete! 🎉**

You should now have a fully functional AlgoAssistant development environment. Happy coding!
