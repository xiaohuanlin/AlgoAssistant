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
  },
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
  },
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
    STATS: '/api/records/stats',
    TAGS: '/api/records/tags',
    ASSIGN_TAGS: (id) => `/api/records/${id}/tags`,
    UPDATE_TAG_WIKI: (tagId) => `/api/records/tags/${tagId}/wiki`,
  },

  // Review System
  REVIEW: {
    LIST: '/api/review/',
    FILTER: '/api/review/filter',
    DUE: '/api/review/due',
    DUE_REVIEWS: '/api/review/due',
    CREATE: '/api/review/',
    DETAIL: (reviewId) => `/api/review/${reviewId}`,
    UPDATE: (reviewId) => `/api/review/${reviewId}`,
    MARK_REVIEWED: (reviewId) => `/api/review/${reviewId}/mark-reviewed`,
    BATCH_MARK_REVIEWED: '/api/review/batch-mark-reviewed',
    BATCH_DELETE: '/api/review/batch-delete',
    DELETE_ALL: '/api/review/delete-all',
    BATCH_UPDATE: '/api/review/batch-update',
    STATS: '/api/review/stats',
  },

  // Platform Integrations
  INTEGRATIONS: {
    NOTION_TEST: '/api/notion/test_connection',
    GITHUB_TEST: '/api/github/test_connection',
    GEMINI_TEST: '/api/gemini/test-connection',
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
  SYNC_TASK: {
    CREATE: '/api/sync_task/',
    LIST: '/api/sync_task/',
    DETAIL: (taskId) => `/api/sync_task/${taskId}`,
    DELETE: (taskId) => `/api/sync_task/${taskId}`,
    STATS: '/api/sync_task/stats',
    RETRY: (taskId) => `/api/sync_task/${taskId}/retry`,
    PAUSE: (taskId) => `/api/sync_task/${taskId}/pause`,
    RESUME: (taskId) => `/api/sync_task/${taskId}/resume`,
  },

  // LeetCode Integration
  LEETCODE: {
    TEST_CONNECTION: '/api/leetcode/test-connection',
    PROFILE: '/api/leetcode/profile',
  },

  // Notion Integration
  NOTION: {
    TEST_CONNECTION: '/api/notion/test_connection',
  },

  // Problem Bank
  PROBLEM: {
    LIST: '/api/problem/',
    CREATE: '/api/problem/',
    DETAIL: (id) => `/api/problem/${id}`,
    UPDATE: (id) => `/api/problem/${id}`,
    DELETE: (id) => `/api/problem/${id}`,
    BATCH_CREATE: '/api/problem/batch-create',
    USER_RECORDS: (id) => `/api/problem/${id}/user-records`,
    STATS: (id) => `/api/problem/${id}/stats`,
    STATISTICS: (id) => `/api/problem/${id}/statistics`,
    BANK_STATS: '/api/problem/stats',
  },

  // Dashboard
  DASHBOARD: {
    BASIC_STATS: '/api/dashboard/stats/basic',
    CATEGORY_STATS: '/api/dashboard/stats/categories',
    OVERVIEW: '/api/dashboard/overview',
  },
};

// Common error handler
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    // Handle detailed validation errors (422 status)
    if (status === 422 && data.detail) {
      // If detail is an array of validation errors (FastAPI style)
      if (Array.isArray(data.detail)) {
        const errorMessages = data.detail.map((err) => {
          let fieldName = 'Unknown field';
          const message = err.msg || err;

          if (err.loc && err.loc.length > 0) {
            // Get the field name from the last element of loc array
            fieldName = err.loc[err.loc.length - 1];

            // Translate common field names
            const fieldTranslations = {
              username: 'Username',
              email: 'Email',
              password: 'Password', // pragma: allowlist secret
              nickname: 'Nickname',
            };
            fieldName = fieldTranslations[fieldName] || fieldName;
          }

          return `${fieldName}: ${message}`;
        });
        return `Validation errors:\n${errorMessages.join('\n')}`;
      }
      // If detail is a string
      return data.detail;
    }

    switch (status) {
      case 400:
        // Handle both string and object responses
        if (typeof data.detail === 'string') {
          return data.detail;
        } else if (data.message) {
          return data.message;
        } else {
          return `Bad request: ${JSON.stringify(data)}`;
        }
      case 401:
        return data.detail || 'Authentication failed, please login again';
      case 403:
        return data.detail || 'Permission denied, cannot access this resource';
      case 404:
        return data.detail || 'The requested resource does not exist';
      case 409:
        return data.detail || 'Resource conflict';
      case 422:
        return data.detail || 'Data validation failed';
      case 429:
        return data.detail || 'Request too frequent, please try again later';
      case 500:
        return data.detail || 'Server internal error, please try again later';
      default:
        return (
          data.detail || data.message || `Request failed with status ${status}`
        );
    }
  } else if (error.request) {
    // Network error
    return 'Network connection failed, please check your internet connection';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred';
  }
};

// Common success handler
export const handleApiSuccess = (response) => {
  return response.data;
};

export default api;
