// Core API
export { default as api } from './api';
export { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

// Authentication
export { default as authService } from './authService';

// Data Services
export { default as recordsService } from './recordsService';
export { default as reviewService } from './reviewService';
export { default as problemService } from './problemService';
export { default as dashboardService } from './dashboardService';

// Integration Services
export { default as leetcodeService } from './leetcodeService';
export { default as notionService } from './notionService';
export { default as gitSyncService } from './gitSyncService';
export { default as geminiSyncService } from './geminiSyncService';
export { default as googleService } from './googleService';

// Sync Services
export { default as syncTaskService } from './syncTaskService';

// Configuration
export { default as configService } from './configService';

// Export service type constants
export const SERVICE_TYPES = {
  GITHUB_SYNC: 'github_sync',
  LEETCODE_BATCH_SYNC: 'leetcode_batch_sync',
  LEETCODE_DETAIL_SYNC: 'leetcode_detail_sync',
  NOTION_SYNC: 'notion_sync',
  AI_ANALYSIS: 'ai_analysis',
};

// Export task status constants
export const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
};

// Export sync status constants
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
  PAUSED: 'paused',
  RETRY: 'retry',
};
