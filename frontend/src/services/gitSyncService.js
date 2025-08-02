import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class GitSyncService {
  /**
   * Get Git configuration
   * @returns {Promise<Object|null>} Git configuration
   */
  async getGitConfig() {
    try {
      // Import configService dynamically to avoid circular dependency
      const configService = (await import('./configService')).default;
      return await configService.getGitConfig();
    } catch (error) {
      // If config doesn't exist, return null instead of throwing error
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update Git configuration
   * @param {Object} configData - Configuration data
   * @returns {Promise<Object>} Update result
   */
  async updateGitConfig(configData) {
    try {
      // Import configService dynamically to avoid circular dependency
      const configService = (await import('./configService')).default;
      return await configService.updateGitConfig(configData);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Test Git connection
   * @param {Object} config - Configuration to test
   * @returns {Promise<Object>} Test result
   */
  async testGitConnection(config) {
    try {
      const response = await api.get(API_ENDPOINTS.INTEGRATIONS.GITHUB_TEST);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create a sync task (GitHub sync)
   * @param {Array<number>} recordIds - Record IDs to sync
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Sync task result
   */
  async syncToGit(recordIds, options = {}) {
    try {
      const config = await this.getGitConfig();
      if (!config) {
        throw new Error('Git configuration not found');
      }
      const syncData = {
        type: 'github_sync',
        record_ids: recordIds,
        ...options,
      };
      const response = await api.post(
        API_ENDPOINTS.SYNC_TASKS.CREATE,
        syncData,
      );
      return handleApiSuccess(response);
    } catch (error) {
      if (error.message.includes('Git configuration not found')) {
        throw error;
      }
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Stop sync task
   * @param {string|number} taskId - Task ID
   * @returns {Promise<Object>} Stop result
   */
  async stopSync(taskId) {
    try {
      // Assuming stop is handled by updating the task status
      const response = await api.put(API_ENDPOINTS.SYNC_TASKS.DETAIL(taskId), {
        status: 'stopped',
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Resume sync task
   * @param {string|number} taskId - Task ID
   * @returns {Promise<Object>} Resume result
   */
  async resumeSync(taskId) {
    try {
      // Assuming resume is handled by updating the task status
      const response = await api.put(API_ENDPOINTS.SYNC_TASKS.DETAIL(taskId), {
        status: 'running',
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Retry failed records in sync task
   * @param {string|number} taskId - Task ID
   * @returns {Promise<Object>} Retry result
   */
  async retryFailedRecords(taskId) {
    try {
      // Assuming retry is handled by updating the task status
      const response = await api.put(API_ENDPOINTS.SYNC_TASKS.DETAIL(taskId), {
        status: 'retry',
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get sync task logs
   * @param {string|number} taskId - Task ID
   * @returns {Promise<Array>} Sync logs
   */
  async getSyncLogs(taskId) {
    try {
      // Assuming logs are part of the task detail or a separate endpoint
      const response = await api.get(API_ENDPOINTS.SYNC_TASKS.DETAIL(taskId));
      return handleApiSuccess(response).logs || [];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get sync task list
   * @returns {Promise<Array>} Task list
   */
  async getTaskList() {
    try {
      const response = await api.get(API_ENDPOINTS.SYNC_TASKS.LIST);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create sync task (generic)
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Created task
   */
  async createSyncTask(taskData) {
    try {
      const response = await api.post(
        API_ENDPOINTS.SYNC_TASKS.CREATE,
        taskData,
      );
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete sync task
   * @param {string|number} taskId - Task ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteSyncTask(taskId) {
    try {
      const response = await api.delete(
        API_ENDPOINTS.SYNC_TASKS.DELETE(taskId),
      );
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get sync task statistics
   * @returns {Promise<Object>} Task statistics
   */
  async getTaskStats() {
    try {
      const response = await api.get(API_ENDPOINTS.SYNC_TASKS.STATS);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get detailed configuration status
   * @returns {Promise<Object>} Configuration status
   */
  async getConfigurationStatus() {
    try {
      const config = await this.getGitConfig();
      if (!config) {
        return {
          configured: false,
          message: 'GitHub not configured',
          action: 'configure',
          actionText: 'Configure Git Repository',
        };
      }
      return {
        configured: true,
        message: 'GitHub configured',
        config: config,
        action: 'test',
        actionText: 'Test connection',
      };
    } catch (error) {
      return {
        configured: false,
        message: 'Failed to check configuration',
        action: 'configure',
        actionText: 'Configure Git Repository',
      };
    }
  }

  /**
   * Get type text
   * @param {string} type - Task type
   * @returns {string} Type text
   */
  getTypeText(type) {
    const typeMap = {
      github_sync: 'GitHub Sync',
      leetcode_batch_sync: 'LeetCode Batch Sync',
      leetcode_detail_sync: 'LeetCode Detail Sync',
      notion_sync: 'Notion Sync',
      ai_analysis: 'AI Analysis',
    };
    return typeMap[type] || type;
  }

  /**
   * Get status text
   * @param {string} status - Task status
   * @returns {string} Status text
   */
  getStatusText(status) {
    const statusMap = {
      pending: 'Pending',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      paused: 'Paused',
    };
    return statusMap[status] || status;
  }

  /**
   * Get status color
   * @param {string} status - Task status
   * @returns {string} Status color
   */
  getStatusColor(status) {
    const colorMap = {
      pending: 'default',
      running: 'processing',
      completed: 'success',
      failed: 'error',
      paused: 'warning',
    };
    return colorMap[status] || 'default';
  }
}

const gitSyncService = new GitSyncService();
export default gitSyncService;
