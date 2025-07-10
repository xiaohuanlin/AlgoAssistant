# AlgoAssistant Environment Configuration Guide

## 🔐 Environment Variables Configuration

**IMPORTANT: Never commit `.env` files containing sensitive information to the code repository!**

### 1. Copy Environment Variable Templates

```bash
# Frontend environment variables
cp frontend/.env.example frontend/.env

# Backend environment variables
cp backend/.env.example backend/.env
```

### 2. Configure Google OAuth

#### Step 1: Create Google Cloud Project
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API

#### Step 2: Create OAuth 2.0 Client
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as application type
4. Configure redirect URIs:
   - `http://localhost:3000` (frontend)
   - `http://localhost:8000/api/google/callback` (backend)

#### Step 3: Configure Test Users
1. Go to "APIs & Services" > "OAuth consent screen"
2. Add your Google email in the "Test users" section
3. Save the configuration

#### Step 4: Update Environment Variables
Edit `frontend/.env`:
```env
REACT_APP_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
```

Edit `backend/.env`:
```env
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

### 3. Optional Configurations

#### GitHub OAuth (Optional)
```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

#### OpenAI API (Optional)
```env
OPENAI_API_KEY=your-openai-api-key
```

#### Notion API (Optional)
```env
NOTION_TOKEN=your-notion-api-token
NOTION_DATABASE_ID=your-notion-database-id
```

### 4. Security Considerations

✅ **Correct Practices:**
- Use `.env.example` as templates
- Add real `.env` files to `.gitignore`
- Configure environment variables manually during deployment

❌ **Wrong Practices:**
- Commit `.env` files containing real secrets to repository
- Hardcode sensitive information in code
- Share secrets with unrelated people

### 5. Environment Variables in Deployment

In production environments, configure environment variables through:

#### Docker Deployment
```bash
# Use environment file
docker-compose --env-file .env up -d

# Or configure directly in docker-compose.yml
environment:
  - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
```

#### Cloud Platform Deployment
- **Vercel/Netlify**: Configure environment variables in platform settings
- **Heroku**: Use `heroku config:set` command
- **AWS/GCP**: Use key management services

### 6. Troubleshooting

#### Google OAuth "invalid_client" Error
1. Check if client ID is correct
2. Confirm redirect URIs are configured correctly
3. Verify test users have been added
4. Clear browser cache

#### Environment Variables Not Working
1. Restart Docker containers
2. Check if file names are correct (`.env`)
3. Confirm variable name format is correct (frontend needs `REACT_APP_` prefix)

### 7. Team Development Collaboration

When new members join the project:

1. Clone the repository
2. Copy environment variable template files
3. Follow the steps above to configure their own Google OAuth
4. Fill in their own environment variable values

**Note: Each developer needs to create their own Google OAuth client, cannot share the same client ID.**

### 8. Production Deployment Checklist

Before deploying to production:

- [ ] Generate new OAuth client for production domain
- [ ] Update redirect URIs for production URLs
- [ ] Set up proper SSL certificates
- [ ] Configure production database
- [ ] Set strong, unique secrets
- [ ] Enable proper logging and monitoring
- [ ] Test OAuth flow in production environment

### 9. Common Issues and Solutions

#### Issue: "This app isn't verified" Error
**Solution**: Add your email as a test user in OAuth consent screen

#### Issue: Redirect URI Mismatch
**Solution**: Ensure redirect URIs in Google Console match exactly with your application URLs

#### Issue: Environment Variables Not Loading
**Solution**: 
1. Restart containers after changing `.env` files
2. Check file permissions
3. Verify variable names match exactly

#### Issue: CORS Errors
**Solution**: Ensure backend CORS settings include your frontend domain

### 10. Best Practices Summary

1. **Security First**: Never commit secrets to version control
2. **Environment Separation**: Use different OAuth clients for dev/staging/prod
3. **Regular Rotation**: Rotate secrets periodically
4. **Monitoring**: Set up alerts for unauthorized access
5. **Documentation**: Keep setup instructions updated
6. **Testing**: Test OAuth flow in each environment before deployment 