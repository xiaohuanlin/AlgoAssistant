# AlgoAssistant API Documentation

## Overview

AlgoAssistant is a comprehensive platform for managing algorithm problem-solving records, integrating with multiple online judge platforms, and providing AI-powered code analysis. This API serves as the backend for the AlgoAssistant application.

## Base URL

```
http://localhost:8000
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

# AlgoAssistant API Summary

## Overview

This document provides a quick overview of all API endpoints in the AlgoAssistant backend, organized by functionality.

## API Statistics

- **Total Endpoints**: 35
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

## Enums

### OJType
- `
