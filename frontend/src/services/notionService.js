import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class NotionService {
  /**
   * Test Notion connection
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      const response = await api.get(API_ENDPOINTS.NOTION.TEST_CONNECTION);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Sync records to Notion
   * @param {Object} syncData - Sync configuration
   * @param {Array<number>} syncData.record_ids - Record IDs to sync
   * @returns {Promise<Object>} Sync result
   */
  async syncRecords(syncData) {
    try {
      const taskData = {
        type: 'notion_sync',
        record_ids: syncData.record_ids
      };
      const response = await api.post(API_ENDPOINTS.SYNC_TASKS.CREATE, taskData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get sync task status
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} Task status
   */
  async getSyncTaskStatus(taskId) {
    try {
      const response = await api.get(API_ENDPOINTS.SYNC_TASK.DETAIL(taskId));
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

const notionService = new NotionService();
export default notionService;
