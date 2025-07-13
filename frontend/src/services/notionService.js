import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class NotionService {
  /**
   * Test Notion connection
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      const response = await api.get(API_ENDPOINTS.INTEGRATIONS.NOTION_TEST);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Sync records to Notion
   * @param {Object} syncData - Sync data
   * @returns {Promise<Object>} Sync result
   */
  async syncRecords(syncData) {
    try {
      const response = await api.post(API_ENDPOINTS.NOTION.SYNC, syncData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Sync specific records to Notion
   * @param {Array<number>} recordIds - Record IDs to sync
   * @returns {Promise<Object>} Sync result
   */
  async syncSpecificRecords(recordIds) {
    return this.syncRecords({ record_ids: recordIds });
  }

  /**
   * Sync all pending records to Notion
   * @returns {Promise<Object>} Sync result
   */
  async syncAllPendingRecords() {
    return this.syncRecords({ sync_all_pending: true });
  }

  /**
   * Update tag wiki in Notion
   * @param {number} tagId - Tag ID
   * @param {string} wiki - Wiki content
   * @returns {Promise<Object>} Update result
   */
  async updateTagWiki(tagId, wiki) {
    try {
      const response = await api.put(API_ENDPOINTS.RECORDS.UPDATE_TAG_WIKI(tagId), {
        wiki
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get Notion configuration
   * @returns {Promise<Object>} Notion configuration
   */
  async getConfig() {
    try {
      const response = await api.get(API_ENDPOINTS.USERS.CONFIG);
      const config = handleApiSuccess(response);
      return config.notion_config || null;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update Notion configuration
   * @param {Object} config - Notion configuration
   * @param {string} config.token - Notion API token
   * @param {string} config.db_id - Notion database ID
   * @returns {Promise<Object>} Update result
   */
  async updateConfig(config) {
    try {
      const currentConfig = await this.getConfig();
      const updatedConfig = {
        ...currentConfig,
        ...config
      };

      const response = await api.put(API_ENDPOINTS.USERS.CONFIG, {
        notion_config: updatedConfig
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Check if Notion is configured
   * @returns {Promise<boolean>} Whether configured
   */
  async isConfigured() {
    try {
      const config = await this.getConfig();
      return !!(config && config.token && config.db_id);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check Notion connection status
   * @returns {Promise<boolean>} Whether connected successfully
   */
  async isConnected() {
    try {
      const result = await this.testConnection();
      return result.connected;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get detailed configuration status
   * @returns {Promise<Object>} Configuration status
   */
  async getConfigurationStatus() {
    try {
      const config = await this.getConfig();
      if (!config) {
        return {
          configured: false,
          message: 'Notion not configured',
          action: 'configure',
          actionText: 'Configure Notion'
        };
      }

      const isConnected = await this.isConnected();
      if (isConnected) {
        return {
          configured: true,
          message: 'Notion connected',
          config: config,
          action: 'test',
          actionText: 'Test connection'
        };
      }

      return {
        configured: false,
        message: 'Notion configuration invalid',
        config: config,
        action: 'configure',
        actionText: 'Update configuration'
      };
    } catch (error) {
      return {
        configured: false,
        message: 'Failed to check configuration',
        action: 'configure',
        actionText: 'Configure Notion'
      };
    }
  }

  /**
   * Get sync status text
   * @param {string} status - Sync status
   * @returns {string} Status text
   */
  getSyncStatusText(status) {
    const statusMap = {
      'pending': 'Pending',
      'syncing': 'Syncing',
      'synced': 'Synced',
      'failed': 'Failed',
    };
    return statusMap[status] || status;
  }

  /**
   * Get sync status color
   * @param {string} status - Sync status
   * @returns {string} Status color
   */
  getSyncStatusColor(status) {
    const colorMap = {
      'pending': 'default',
      'syncing': 'processing',
      'synced': 'success',
      'failed': 'error',
    };
    return colorMap[status] || 'default';
  }

  /**
   * Format Notion URL
   * @param {string} pageId - Page ID
   * @returns {string} Notion page URL
   */
  formatNotionUrl(pageId) {
    if (!pageId) return '';
    return `https://notion.so/${pageId.replace(/-/g, '')}`;
  }

  /**
   * Validate Notion configuration
   * @param {Object} config - Notion configuration
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const errors = [];

    if (!config.token) {
      errors.push('Notion API token cannot be empty');
    }

    if (!config.db_id) {
      errors.push('Notion database ID cannot be empty');
    }

    // Validate database ID format
    if (config.db_id && !/^[a-f0-9]{32}$/.test(config.db_id.replace(/-/g, ''))) {
      errors.push('Notion database ID format is incorrect');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get Notion page title
   * @param {string} pageId - Page ID
   * @returns {string} Page title
   */
  getPageTitle(pageId) {
    if (!pageId) return '';
    return `Notion page ${pageId.substring(0, 8)}...`;
  }

  /**
   * Create Notion page link
   * @param {string} pageId - Page ID
   * @param {string} title - Page title
   * @returns {Object} Link object
   */
  createPageLink(pageId, title) {
    return {
      url: this.formatNotionUrl(pageId),
      title: title || this.getPageTitle(pageId),
      external: true
    };
  }

  /**
   * Validate database ID format
   * @param {string} dbId - Database ID to validate
   * @returns {boolean} Whether valid
   */
  validateDatabaseId(dbId) {
    // Validate database ID format
    const dbIdPattern = /^[a-zA-Z0-9]{32}$/;
    return dbIdPattern.test(dbId);
  }
}

export default new NotionService();
