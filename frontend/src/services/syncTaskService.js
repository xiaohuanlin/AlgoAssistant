import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class SyncTaskService {
  /**
   * Create a sync task
   * @param[object Object]Object} taskData - Task data
   * @param {string} taskData.type - Task type (github_sync, leetcode_batch_sync, leetcode_detail_sync, notion_sync, ai_analysis)
   * @param {Array<number>} taskData.record_ids - Record ID list
   * @returns {Promise<Object>} Created task
   */
  async createTask(taskData) {
    try {
      const response = await api.post(API_ENDPOINTS.SYNC_TASKS.CREATE, taskData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get sync task list
   * @param {Object} params - Query parameters
   * @param {string} params.type - Task type filter
   * @param {string} params.status - Task status filter
   * @param {number} params.limit - Limit count
   * @param {number} params.offset - Offset
   * @returns {Promise<Array>} Task list
   */
  async getTasks(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.SYNC_TASKS.LIST, { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get specific task details
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} Task details
   */
  async getTask(taskId) {
    try {
      const response = await api.get(API_ENDPOINTS.SYNC_TASKS.DETAIL(taskId));
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete sync task
   * @param {number} taskId - Task ID
   * @returns {Promise<boolean>} Delete result
   */
  async deleteTask(taskId) {
    try {
      await api.delete(API_ENDPOINTS.SYNC_TASKS.DELETE(taskId));
      return true;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get task statistics
   * @returns {Promise<Object>} Task statistics
   */
  async getTaskStats() {
    try {
      const tasks = await this.getTasks({ limit: 1000 });

      const stats = {
        total: tasks.length,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        paused: 0,
      };

      tasks.forEach(task => {
        if (stats.hasOwnProperty(task.status)) {
          stats[task.status]++;
        }
      });

      return stats;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create GitHub sync task
   * @param {Array<number>} recordIds - Record ID list
   * @returns {Promise<Object>} Created task
   */
  async createGitHubSyncTask(recordIds) {
    return this.createTask({
      type: 'github_sync',
      record_ids: recordIds,
    });
  }

  /**
   * Create LeetCode batch sync task
   * @param {Object} params - Sync parameters
   * @returns {Promise<Object>} Created task
   */
  async createLeetCodeBatchSyncTask(params = {}) {
    return this.createTask({
      type: 'leetcode_batch_sync',
      ...params,
    });
  }

  /**
   * Create LeetCode detail sync task
   * @param {Array<number>} recordIds - Record ID list
   * @returns {Promise<Object>} Created task
   */
  async createLeetCodeDetailSyncTask(recordIds) {
    return this.createTask({
      type: 'leetcode_detail_sync',
      record_ids: recordIds,
    });
  }

  /**
   * Create Notion sync task
   * @param {Array<number>} recordIds - Record ID list
   * @returns {Promise<Object>} Created task
   */
  async createNotionSyncTask(recordIds) {
    return this.createTask({
      type: 'notion_sync',
      record_ids: recordIds,
    });
  }

  /**
   * Create AI analysis task
   * @param {Array<number>} recordIds - Record ID list
   * @returns {Promise<Object>} Created task
   */
  async createAIAnalysisTask(recordIds) {
    return this.createTask({
      type: 'ai_analysis',
      record_ids: recordIds,
    });
  }

  /**
   * Create Gemini sync task
   * @param {Array<number>} recordIds - Record ID list
   * @returns {Promise<Object>} Created task
   */
  async createGeminiSyncTask(recordIds) {
    return this.createTask({
      type: 'gemini_sync',
      record_ids: recordIds,
    });
  }

  /**
   * Get status text
   * @param {string} status - Task status
   * @param {function} t - i18n translate function
   * @returns {string} Status text
   */
  getStatusText(status, t) {
    const statusMap = {
      'pending': t ? t('syncTasks.status.pending') : 'Pending',
      'running': t ? t('syncTasks.status.running') : 'Running',
      'completed': t ? t('syncTasks.status.completed') : 'Completed',
      'failed': t ? t('syncTasks.status.failed') : 'Failed',
      'paused': t ? t('syncTasks.status.paused') : 'Paused',
    };
    return statusMap[status] || status;
  }

  /**
   * Get task status color
   * @param {string} status - Task status
   * @returns {string} Status color
   */
  getStatusColor(status) {
    const colorMap = {
      'pending': 'default',
      'running': 'processing',
      'completed': 'success',
      'failed': 'error',
      'paused': 'warning',
    };
    return colorMap[status] || 'default';
  }

  /**
   * Get task type text
   * @param {string} type - Task type
   * @param {function} t - i18n translate function
   * @returns {string} Type text
   */
  getTypeText(type, t) {
    const typeMap = {
      'github_sync': t ? t('syncTasks.taskTypes.github_sync') : 'GitHub Sync',
      'leetcode_batch_sync': t ? t('syncTasks.taskTypes.leetcode_batch_sync') : 'LeetCode Batch Sync',
      'leetcode_detail_sync': t ? t('syncTasks.taskTypes.leetcode_detail_sync') : 'LeetCode Detail Sync',
      'notion_sync': t ? t('syncTasks.taskTypes.notion_sync') : 'Notion Sync',
      'ai_analysis': t ? t('syncTasks.taskTypes.ai_analysis') : 'AI Analysis',
      'gemini_sync': t ? t('syncTasks.taskTypes.gemini_sync') : 'Gemini Sync',
    };
    return typeMap[type] || type;
  }

  /**
   * Check if task can be cancelled
   * @param {string} status - Task status
   * @returns {boolean} Whether task can be cancelled
   */
  canCancel(status) {
    return ['pending', 'running'].includes(status);
  }

  /**
   * Check if task can be retried
   * @param {string} status - Task status
   * @returns {boolean} Whether task can be retried
   */
  canRetry(status) {
    return ['failed', 'paused'].includes(status);
  }

  /**
   * Retry a task
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} Retry result
   */
  async retryTask(taskId) {
    try {
      const response = await api.post(API_ENDPOINTS.SYNC_TASKS.RETRY(taskId));
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pause a task
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} Pause result
   */
  async pauseTask(taskId) {
    try {
      const response = await api.post(API_ENDPOINTS.SYNC_TASKS.PAUSE(taskId));
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Resume a task
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} Resume result
   */
  async resumeTask(taskId) {
    try {
      const response = await api.post(API_ENDPOINTS.SYNC_TASKS.RESUME(taskId));
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Check if task can be paused
   * @param {string} status - Task status
   * @returns {boolean} Whether task can be paused
   */
  canPause(status) {
    return ['running'].includes(status);
  }

  /**
   * Check if task can be resumed
   * @param {string} status - Task status
   * @returns {boolean} Whether task can be resumed
   */
  canResume(status) {
    return ['paused'].includes(status);
  }
}

const instance = new SyncTaskService();
export default instance;
