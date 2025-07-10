# AlgoAssistant

A comprehensive algorithm practice management system with AI-powered analysis and integration with multiple platforms.

## Features

- **User Authentication**: Secure login/register with JWT tokens
- **Google OAuth**: Login with Google account
- **GitHub OAuth**: Connect GitHub account for code sync
- **Problem Records**: Track algorithm problem solutions
- **AI Analysis**: OpenAI-powered code analysis and suggestions
- **Notion Integration**: Sync records to Notion database
- **Review System**: Spaced repetition for wrong problems
- **Multi-language Support**: English and Chinese interface
- **Docker Deployment**: Easy containerized deployment

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Google OAuth credentials
- GitHub OAuth credentials (optional)
- OpenAI API key (optional)
- Notion API token (optional)

### 1. Clone the repository

```bash
git clone <repository-url>
cd AlgoAssistant
```

### 2. Configure environment variables

**⚠️ IMPORTANT: Never commit your `.env` files to the repository!**

```bash
# Copy environment variable templates
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Edit the files with your actual credentials
# See SETUP.md for detailed instructions
```

#### Required Configuration

1. **Google OAuth Setup**:
   - Create OAuth 2.0 client in [Google Cloud Console](https://console.cloud.google.com/)
   - Add test users in OAuth consent screen
   - Update `frontend/.env` and `backend/.env` with your credentials

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
docker-compose -f docker-compose.dev.yml up

# Or start individual services
docker-compose -f docker-compose.dev.yml up backend
docker-compose -f docker-compose.dev.yml up frontend
```

#### Production mode

```bash
# Start all services
docker-compose up -d
```

### 4. Access the application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development

### Project Structure

```
AlgoAssistant/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── config.py       # Configuration
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── i18n/           # Internationalization
│   └── package.json        # Node.js dependencies
└── docker-compose.yml      # Docker orchestration
```

### API Endpoints

#### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/google/login` - Google OAuth login
- `GET /api/me` - Get current user info

#### Google OAuth
- `GET /api/google/auth` - Get Google auth URL
- `GET /api/google/callback` - Handle OAuth callback
- `GET /api/google/status` - Check connection status
- `DELETE /api/google/disconnect` - Disconnect Google

#### Problem Records
- `GET /api/records` - Get user records
- `POST /api/records` - Create new record
- `PUT /api/records/{id}` - Update record
- `DELETE /api/records/{id}` - Delete record

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Security

### Environment Variables

- **Never commit `.env` files** containing real credentials
- Use `.env.example` files as templates
- Configure environment variables in production securely
- Each developer should create their own OAuth clients

### Best Practices

- Use strong, unique secrets for each environment
- Rotate credentials regularly
- Use environment-specific configurations
- Monitor for unauthorized access

## Deployment

### Production Deployment

1. Update environment variables for production
2. Set up SSL certificates
3. Configure reverse proxy (nginx)
4. Use production Docker images

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SECRET_KEY` | JWT secret key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `REACT_APP_GOOGLE_CLIENT_ID` | Frontend Google client ID | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.