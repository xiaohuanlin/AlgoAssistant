import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class GeminiSyncService {
  /**
   * Sync record to Gemini for AI analysis
   * @param {Array<number>} recordIds - Record IDs to sync
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Sync task result
   */
  async syncToGemini(recordIds, options = {}) {
    try {
      const syncData = {
        type: 'gemini_sync',
        record_ids: recordIds,
        ...options,
      };
      const response = await api.post(
        API_ENDPOINTS.SYNC_TASKS.CREATE,
        syncData,
      );
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get Gemini sync task status
   * @param {string|number} taskId - Task ID
   * @returns {Promise<Object>} Task status
   */
  async getTaskStatus(taskId) {
    try {
      const response = await api.get(API_ENDPOINTS.SYNC_TASKS.DETAIL(taskId));
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get Gemini sync task list
   * @returns {Promise<Array>} Task list
   */
  async getTaskList() {
    try {
      const response = await api.get(API_ENDPOINTS.SYNC_TASKS.LIST, {
        params: { type: 'gemini_sync' },
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Stop Gemini sync task
   * @param {string|number} taskId - Task ID
   * @returns {Promise<Object>} Stop result
   */
  async stopTask(taskId) {
    try {
      const response = await api.put(API_ENDPOINTS.SYNC_TASKS.DETAIL(taskId), {
        status: 'stopped',
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Resume Gemini sync task
   * @param {string|number} taskId - Task ID
   * @returns {Promise<Object>} Resume result
   */
  async resumeTask(taskId) {
    try {
      const response = await api.put(API_ENDPOINTS.SYNC_TASKS.DETAIL(taskId), {
        status: 'running',
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Test Gemini connection
   * @param {Object} config - { api_key, model_name }
   * @returns {Promise<Object>} Test result
   */
  async testGeminiConnection(config) {
    try {
      const response = await api.post(
        API_ENDPOINTS.INTEGRATIONS.GEMINI_TEST,
        config,
      );
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

const geminiSyncService = new GeminiSyncService();
export default geminiSyncService;
