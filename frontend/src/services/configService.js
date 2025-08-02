import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class ConfigService {
  constructor() {
    this.configCache = null;
    this.lastFetchTime = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Get all user configurations
   * @param {boolean} forceRefresh - Force refresh cache
   * @returns {Promise<Object>} All configurations
   */
  async getAllConfigs(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh && this.configCache && this.lastFetchTime) {
      const now = Date.now();
      if (now - this.lastFetchTime < this.cacheExpiry) {
        return this.configCache;
      }
    }

    try {
      const response = await api.get(API_ENDPOINTS.USERS.CONFIG);
      const result = handleApiSuccess(response);

      // Cache the result
      this.configCache = result;
      this.lastFetchTime = Date.now();

      return result;
    } catch (error) {
      // If config doesn't exist, return empty object instead of throwing error
      if (error.response?.status === 404) {
        const emptyConfig = {};
        this.configCache = emptyConfig;
        this.lastFetchTime = Date.now();
        return emptyConfig;
      }
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get LeetCode configuration
   * @param {boolean} forceRefresh - Force refresh cache
   * @returns {Promise<Object|null>} LeetCode configuration
   */
  async getLeetCodeConfig(forceRefresh = false) {
    const configs = await this.getAllConfigs(forceRefresh);
    return configs.leetcode_config || null;
  }

  /**
   * Get GitHub configuration
   * @param {boolean} forceRefresh - Force refresh cache
   * @returns {Promise<Object|null>} GitHub configuration
   */
  async getGitConfig(forceRefresh = false) {
    const configs = await this.getAllConfigs(forceRefresh);
    return configs.github_config || null;
  }

  /**
   * Get Gemini configuration
   * @param {boolean} forceRefresh - Force refresh cache
   * @returns {Promise<Object|null>} Gemini configuration
   */
  async getGeminiConfig(forceRefresh = false) {
    const configs = await this.getAllConfigs(forceRefresh);
    return configs.gemini_config || null;
  }

  /**
   * Get Notion configuration
   * @param {boolean} forceRefresh - Force refresh cache
   * @returns {Promise<Object|null>} Notion configuration
   */
  async getNotionConfig(forceRefresh = false) {
    const configs = await this.getAllConfigs(forceRefresh);
    return configs.notion_config || null;
  }

  /**
   * Update LeetCode configuration
   * @param {Object} configData - Configuration data
   * @returns {Promise<Object>} Update result
   */
  async updateLeetCodeConfig(configData) {
    try {
      // Get current configs to preserve other configurations
      const currentConfigs = await this.getAllConfigs();

      const requestData = {
        ...currentConfigs,
        leetcode_config: {
          session_cookie: configData.session_cookie,
          username: configData.username,
        },
      };

      const response = await api.put(API_ENDPOINTS.USERS.CONFIG, requestData);
      const result = handleApiSuccess(response);

      // Update cache
      this.configCache = result;
      this.lastFetchTime = Date.now();

      return result;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update GitHub configuration
   * @param {Object} configData - Configuration data
   * @returns {Promise<Object>} Update result
   */
  async updateGitConfig(configData) {
    try {
      // Get current configs to preserve other configurations
      const currentConfigs = await this.getAllConfigs();

      const githubConfig = {
        repo_url: configData.repo_url,
        branch: configData.branch,
        base_path: configData.base_path,
        file_template: configData.file_template,
        commit_message_template:
          configData.commit_template || configData.commit_message_template,
        token: configData.token,
      };

      const requestData = {
        ...currentConfigs,
        github_config: githubConfig,
      };

      const response = await api.put(API_ENDPOINTS.USERS.CONFIG, requestData);
      const result = handleApiSuccess(response);

      // Update cache
      this.configCache = result;
      this.lastFetchTime = Date.now();

      return result;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update Gemini configuration
   * @param {Object} configData - Gemini configuration data (e.g. { api_key })
   * @returns {Promise<Object>} Update result
   */
  async updateGeminiConfig(configData) {
    try {
      const currentConfigs = await this.getAllConfigs();
      const requestData = {
        ...currentConfigs,
        gemini_config: configData,
      };
      const response = await api.put(API_ENDPOINTS.USERS.CONFIG, requestData);
      const result = handleApiSuccess(response);
      this.configCache = result;
      this.lastFetchTime = Date.now();
      return result;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update Notion configuration
   * @param {Object} configData - Notion configuration data (e.g. { token, db_id })
   * @returns {Promise<Object>} Update result
   */
  async updateNotionConfig(configData) {
    try {
      const currentConfigs = await this.getAllConfigs();
      const requestData = {
        ...currentConfigs,
        notion_config: configData,
      };
      const response = await api.put(API_ENDPOINTS.USERS.CONFIG, requestData);
      const result = handleApiSuccess(response);
      this.configCache = result;
      this.lastFetchTime = Date.now();
      return result;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.configCache = null;
    this.lastFetchTime = null;
  }

  /**
   * Update multiple configurations at once
   * @param {Object} configUpdates - Configuration updates {leetcode_config, github_config, etc.}
   * @returns {Promise<Object>} Update result
   */
  async updateConfigs(configUpdates) {
    try {
      // Get current configs to preserve other configurations
      const currentConfigs = await this.getAllConfigs();

      const requestData = {
        ...currentConfigs,
        ...configUpdates,
      };

      const response = await api.put(API_ENDPOINTS.USERS.CONFIG, requestData);
      const result = handleApiSuccess(response);

      // Update cache
      this.configCache = result;
      this.lastFetchTime = Date.now();

      return result;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get cached configs (if available)
   * @returns {Object|null} Cached configs
   */
  getCachedConfigs() {
    return this.configCache;
  }
}

const configService = new ConfigService();
export default configService;
