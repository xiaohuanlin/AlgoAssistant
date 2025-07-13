// Export all services
export { default as authService } from './authService';
export { default as recordsService } from './recordsService';
export { default as leetcodeService } from './leetcodeService';
export { default as gitSyncService } from './gitSyncService';
export { default as notionService } from './notionService';
export { default as syncTaskService } from './syncTaskService';
export { default as aiAnalysisService } from './aiAnalysisService';
export { default as reviewService } from './reviewService';
export { default as googleService } from './googleService';

// Export service type constants
export const SERVICE_TYPES = {
  GITHUB_SYNC: 'github_sync',
  LEETCODE_BATCH_SYNC: 'leetcode_batch_sync',
  LEETCODE_DETAIL_SYNC: 'leetcode_detail_sync',
  NOTION_SYNC: 'notion_sync',
  AI_ANALYSIS: 'ai_analysis'
};

// Export task status constants
export const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused'
};

// Export sync status constants
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
  PAUSED: 'paused',
  RETRY: 'retry'
};
