import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear local storage and redirect to login page
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints configuration - Completely match backend README
export const API_ENDPOINTS = {
  // Health Check
  HEALTH: '/health',
  ROOT: '/',

  // User Management
  USERS: {
    REGISTER: '/api/users/register',
    LOGIN: '/api/users/login',
    ME: '/api/users/me',
    PROFILE: '/api/users/user/profile',
    CONFIG: '/api/users/config',
  },

  // Records
  RECORDS: {
    LIST: '/api/records/',
    CREATE: '/api/records/',
    DETAIL: (id) => `/api/records/${id}`,
    UPDATE: (id) => `/api/records/${id}`,
    DELETE: (id) => `/api/records/${id}`,
    TAGS: '/api/records/tags',
    ASSIGN_TAGS: (id) => `/api/records/${id}/tags`,
    UPDATE_TAG_WIKI: (tagId) => `/api/records/tags/${tagId}/wiki`,
  },

  // Review System
  REVIEW: {
    MARK_WRONG: (recordId) => `/api/review/mark/${recordId}`,
    LIST: '/api/review/list',
    DUE: '/api/review/due',
    COMPLETE: (reviewId) => `/api/review/${reviewId}/complete`,
  },

  // Platform Integrations
  INTEGRATIONS: {
    LEETCODE_TEST: '/api/leetcode/test-connection',
    NOTION_TEST: '/api/notion/test_connection',
    GITHUB_TEST: '/api/github/test_connection',
  },

  // Google OAuth
  GOOGLE: {
    AUTH: '/api/google/auth',
    CALLBACK: '/api/google/callback',
    STATUS: '/api/google/status',
    DISCONNECT: '/api/google/disconnect',
    LOGIN: '/api/google/login',
  },

  // Sync Tasks
  SYNC_TASKS: {
    CREATE: '/api/sync_task/',
    LIST: '/api/sync_task/',
    DETAIL: (taskId) => `/api/sync_task/${taskId}`,
    DELETE: (taskId) => `/api/sync_task/${taskId}`,
    STATS: '/api/sync_task/stats',
    RETRY: (taskId) => `/api/sync_task/${taskId}/retry`,
    PAUSE: (taskId) => `/api/sync_task/${taskId}/pause`,
    RESUME: (taskId) => `/api/sync_task/${taskId}/resume`,
  },

  // GitHub Integration (supplement)
  GITHUB: {
    SYNC: '/api/github/sync',
    SYNC_STATUS: '/api/github/sync/status',
    SYNC_PROGRESS: '/api/github/sync/progress',
    SYNC_STOP: '/api/github/sync/stop',
    SYNC_RESUME: '/api/github/sync/resume',
    RETRY_FAILED: '/api/github/sync/retry',
    SYNC_LOGS: '/api/github/sync/logs',
  },

  // LeetCode Integration (supplement)
  LEETCODE: {
    SYNC: '/api/leetcode/sync',
    SYNC_PROGRESS: '/api/leetcode/sync/progress',
    SYNC_STOP: '/api/leetcode/sync/stop',
    SYNC_LOGS: '/api/leetcode/sync/logs',
    PROFILE: '/api/leetcode/profile',
  },

  // Notion Integration (supplement)
  NOTION: {
    SYNC: '/api/notion/sync',
    SYNC_STATUS: '/api/notion/sync/status',
    SYNC_PROGRESS: '/api/notion/sync/progress',
  },

  // AI Analysis
  AI: {
    ANALYZE: '/api/ai/analyze',
    ANALYZE_BATCH: '/api/ai/analyze/batch',
    STATUS: (recordId) => `/api/ai/status/${recordId}`,
    STATS: '/api/ai/stats',
    HISTORY: (recordId) => `/api/ai/history/${recordId}`,
  },

  // AI Analysis (legacy)
  AI_ANALYSIS: {
    CREATE: '/api/ai_analysis/',
    LIST: '/api/ai_analysis/',
    DETAIL: (taskId) => `/api/ai_analysis/${taskId}`,
    DELETE: (taskId) => `/api/ai_analysis/${taskId}`,
    STATS: '/api/ai_analysis/stats',
  },
};

// Common error handler
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return `Request parameter error: ${data.detail || 'Please check the input data'}`;
      case 401:
        return 'Authentication failed, please login again';
      case 403:
        return 'Permission denied, cannot access this resource';
      case 404:
        return 'The requested resource does not exist';
      case 422:
        return `Data validation failed: ${data.detail || 'Please check the input format'}`;
      case 429:
        return 'Request too frequent, please try again later';
      case 500:
        return 'Server internal error, please try again later';
      default:
        return `Request failed (${status}): ${data.detail || 'Unknown error'}`;
    }
  } else if (error.request) {
    // Network error
    return 'Network connection failed, please check the network settings';
  } else {
    // Other error
    return `Request error: ${error.message}`;
  }
};

// Common success handler
export const handleApiSuccess = (response) => {
  return response.data;
};

export default api;
