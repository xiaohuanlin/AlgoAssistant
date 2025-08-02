import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class LeetCodeService {
  /**
   * Get LeetCode configuration
   * @returns {Promise<Object>} LeetCode configuration
   */
  async getLeetCodeConfig() {
    try {
      // Import configService dynamically to avoid circular dependency
      const configService = (await import('./configService')).default;
      return await configService.getLeetCodeConfig();
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update LeetCode configuration
   * @param {Object} configData - Configuration data {session_cookie, username}
   * @returns {Promise<Object>} Update result
   */
  async updateLeetCodeConfig(configData) {
    try {
      // Import configService dynamically to avoid circular dependency
      const configService = (await import('./configService')).default;
      return await configService.updateLeetCodeConfig(configData);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update LeetCode configuration (alias method)
   * @param {Object} configData - Configuration data
   * @returns {Promise<Object>} Update result
   */
  async updateConfig(configData) {
    // Handle different data structures
    let processedData = configData;

    // If input is in leetcode_token format, convert to session_cookie format
    if (configData.leetcode_token) {
      processedData = {
        session_cookie: configData.leetcode_token,
        username: configData.username || '',
      };
    }

    return this.updateLeetCodeConfig(processedData);
  }

  /**
   * Get LeetCode configuration (alias method)
   * @returns {Promise<Object>} LeetCode configuration
   */
  async getConfig() {
    try {
      const config = await this.getLeetCodeConfig();
      // Convert to format expected by components
      if (config) {
        return {
          leetcode_token: config.session_cookie || '',
          username: config.username || '',
        };
      }
      return null;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get LeetCode user profile
   * @param {string} username - Username (optional)
   * @returns {Promise<Object>} User profile
   */
  async getLeetCodeProfile(username = null) {
    try {
      const params = username ? { username } : {};
      const response = await api.get(API_ENDPOINTS.LEETCODE.PROFILE, {
        params,
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Test LeetCode connection
   * @returns {Promise<Object>} Connection test result
   */
  async testLeetCodeConnection() {
    try {
      const response = await api.get(API_ENDPOINTS.LEETCODE.TEST_CONNECTION);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Check if LeetCode is configured
   * @returns {Promise<boolean>} Whether configured
   */
  async isConfigured() {
    try {
      const config = await this.getLeetCodeConfig();
      return !!(config && config.username);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check LeetCode connection status
   * @returns {Promise<boolean>} Whether connected successfully
   */
  async isConnected() {
    try {
      const result = await this.testLeetCodeConnection();
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
      const config = await this.getLeetCodeConfig();
      if (!config) {
        return {
          configured: false,
          message: 'LeetCode not configured',
          action: 'configure',
          actionText: 'Configure LeetCode',
        };
      }

      const isConnected = await this.isConnected();
      if (isConnected) {
        return {
          configured: true,
          message: 'LeetCode connected',
          config: config,
          action: 'test',
          actionText: 'Test connection',
        };
      }

      return {
        configured: false,
        message: 'LeetCode configuration invalid',
        config: config,
        action: 'configure',
        actionText: 'Update configuration',
      };
    } catch (error) {
      return {
        configured: false,
        message: 'Failed to check configuration',
        action: 'configure',
        actionText: 'Configure LeetCode',
      };
    }
  }

  /**
   * Validate configuration
   * @param {Object} config - Configuration to validate
   * @returns {boolean} Whether valid
   */
  validateConfig(config) {
    return !!(config && config.session_cookie && config.username);
  }
}

const leetcodeService = new LeetCodeService();
export default leetcodeService;
