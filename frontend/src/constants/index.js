// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  RECORDS: {
    LIST: '/records',
    CREATE: '/records',
    DETAIL: '/records/:id',
    UPDATE: '/records/:id',
    DELETE: '/records/:id',
    STATS: '/records/stats',
  },
  PROBLEMS: {
    LIST: '/problems',
    CREATE: '/problems',
    DETAIL: '/problems/:id',
    UPDATE: '/problems/:id',
    DELETE: '/problems/:id',
  },
  SYNC: {
    GITHUB: '/sync/github',
    LEETCODE: '/sync/leetcode',
    GEMINI: '/sync/gemini',
    NOTION: '/sync/notion',
    STATUS: '/sync/status',
    TASKS: '/sync/tasks',
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    ACTIVITY: '/dashboard/activity',
    ERRORS: '/dashboard/errors',
    CATEGORIES: '/dashboard/categories',
  },
};

// UI Constants
export const UI_CONSTANTS = {
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1440,
  },
  DEBOUNCE_DELAY: {
    SEARCH: 300,
    FILTER: 500,
    RESIZE: 100,
  },
  ANIMATION: {
    FADE_DURATION: 300,
    SLIDE_DURATION: 200,
    SPIN_DURATION: 1000,
  },
  TABLE: {
    PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: ['10', '20', '50', '100'],
    SCROLL_HEIGHT: 400,
  },
  FORM: {
    LABEL_COL: { span: 6 },
    WRAPPER_COL: { span: 18 },
  },
};

// Status Constants
export const STATUS = {
  EXECUTION: {
    ACCEPTED: 'Accepted',
    WRONG_ANSWER: 'Wrong Answer',
    TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
    MEMORY_LIMIT_EXCEEDED: 'Memory Limit Exceeded',
    COMPILATION_ERROR: 'Compilation Error',
    RUNTIME_ERROR: 'Runtime Error',
  },
  SYNC: {
    IDLE: 'idle',
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  },
  CONFIG: {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
    PENDING: 'pending',
  },
};

// Color Maps for Status
export const STATUS_COLORS = {
  EXECUTION: {
    [STATUS.EXECUTION.ACCEPTED]: 'success',
    [STATUS.EXECUTION.WRONG_ANSWER]: 'error',
    [STATUS.EXECUTION.TIME_LIMIT_EXCEEDED]: 'warning',
    [STATUS.EXECUTION.MEMORY_LIMIT_EXCEEDED]: 'warning',
    [STATUS.EXECUTION.COMPILATION_ERROR]: 'error',
    [STATUS.EXECUTION.RUNTIME_ERROR]: 'error',
  },
  SYNC: {
    [STATUS.SYNC.IDLE]: 'default',
    [STATUS.SYNC.PENDING]: 'processing',
    [STATUS.SYNC.RUNNING]: 'processing',
    [STATUS.SYNC.COMPLETED]: 'success',
    [STATUS.SYNC.FAILED]: 'error',
    [STATUS.SYNC.CANCELLED]: 'warning',
  },
  CONFIG: {
    [STATUS.CONFIG.CONNECTED]: 'success',
    [STATUS.CONFIG.DISCONNECTED]: 'default',
    [STATUS.CONFIG.ERROR]: 'error',
    [STATUS.CONFIG.PENDING]: 'processing',
  },
};

// Language Constants
export const LANGUAGES = {
  PROGRAMMING: {
    PYTHON: 'python',
    JAVASCRIPT: 'javascript',
    JAVA: 'java',
    CPP: 'cpp',
    C: 'c',
    GO: 'go',
    RUST: 'rust',
    SWIFT: 'swift',
    KOTLIN: 'kotlin',
    TYPESCRIPT: 'typescript',
  },
  UI: {
    EN: 'en',
    ZH: 'zh',
  },
};

// Integration Types
export const INTEGRATIONS = {
  GITHUB: 'github',
  LEETCODE: 'leetcode',
  GEMINI: 'gemini',
  NOTION: 'notion',
};

// Error Types
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  SYNC: 'sync',
  CONFIG: 'config',
  UNKNOWN: 'unknown',
};

// Difficulty Levels
export const DIFFICULTY = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export const DIFFICULTY_COLORS = {
  [DIFFICULTY.EASY]: 'success',
  [DIFFICULTY.MEDIUM]: 'warning',
  [DIFFICULTY.HARD]: 'error',
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  LANGUAGE: 'language',
  THEME: 'theme',
  CONFIG_CACHE: 'configCache',
  DASHBOARD_CACHE: 'dashboardCache',
};

// Cache Configuration
export const CACHE_CONFIG = {
  CONFIG_EXPIRY: 5 * 60 * 1000, // 5 minutes
  DASHBOARD_EXPIRY: 2 * 60 * 1000, // 2 minutes
  USER_EXPIRY: 30 * 60 * 1000, // 30 minutes
};

// Route Paths
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/',
  RECORDS: '/records',
  RECORD_DETAIL: '/records/:id',
  RECORD_CREATE: '/records/create',
  PROBLEMS: '/problem',
  PROBLEM_DETAIL: '/problem/:id',
  PROBLEM_CREATE: '/problem/create',
  REVIEW: '/review',
  REVIEW_DETAIL: '/review/:id',
  SYNC_TASKS: '/sync-tasks',
  SETTINGS: '/settings',
  GEMINI_INTEGRATION: '/gemini-integration',
};

// Permission Constants
export const PERMISSIONS = {
  RECORDS: {
    VIEW: 'records:view',
    CREATE: 'records:create',
    UPDATE: 'records:update',
    DELETE: 'records:delete',
  },
  PROBLEMS: {
    VIEW: 'problems:view',
    CREATE: 'problems:create',
    UPDATE: 'problems:update',
    DELETE: 'problems:delete',
  },
  SYNC: {
    VIEW: 'sync:view',
    START: 'sync:start',
    STOP: 'sync:stop',
    CONFIGURE: 'sync:configure',
  },
  ADMIN: {
    USER_MANAGEMENT: 'admin:users',
    SYSTEM_CONFIG: 'admin:config',
  },
};

const Constants = {
  API_ENDPOINTS,
  UI_CONSTANTS,
  STATUS,
  STATUS_COLORS,
  LANGUAGES,
  INTEGRATIONS,
  ERROR_TYPES,
  DIFFICULTY,
  DIFFICULTY_COLORS,
  STORAGE_KEYS,
  CACHE_CONFIG,
  ROUTES,
  PERMISSIONS,
};

export default Constants;
