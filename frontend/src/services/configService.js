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
   * Update LeetCode configuration
   * @param {Object} configData - Configuration data
   * @returns {Promise<Object>} Update result
   */
  async updateLeetCodeConfig(configData) {
    try {
      console.log('Updating LeetCode config with data:', configData);

      // Get current configs to preserve other configurations
      const currentConfigs = await this.getAllConfigs();
      console.log('Current configs:', currentConfigs);

      const requestData = {
        ...currentConfigs,
        leetcode_config: {
          session_cookie: configData.session_cookie,
          username: configData.username
        }
      };

      console.log('Sending request data:', requestData);
      const response = await api.put(API_ENDPOINTS.USERS.CONFIG, requestData);
      const result = handleApiSuccess(response);

      console.log('Update result:', result);

      // Update cache
      this.configCache = result;
      this.lastFetchTime = Date.now();

      return result;
    } catch (error) {
      console.error('Error updating LeetCode config:', error);
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
      console.log('Updating Git config with data:', configData);

      // Get current configs to preserve other configurations
      const currentConfigs = await this.getAllConfigs();
      console.log('Current configs:', currentConfigs);

      const githubConfig = {
        repo_url: configData.repo_url,
        branch: configData.branch,
        base_path: configData.base_path,
        file_template: configData.file_template,
        commit_message_template: configData.commit_template || configData.commit_message_template,
        token: configData.token
      };

      console.log('GitHub config being sent:', githubConfig);
      console.log('commit_template from frontend:', configData.commit_template);
      console.log('commit_message_template from frontend:', configData.commit_message_template);
      console.log('Final commit_message_template:', githubConfig.commit_message_template);

      const requestData = {
        ...currentConfigs,
        github_config: githubConfig
      };

      console.log('Sending request data:', requestData);
      const response = await api.put(API_ENDPOINTS.USERS.CONFIG, requestData);
      const result = handleApiSuccess(response);

      console.log('Update result:', result);

      // Update cache
      this.configCache = result;
      this.lastFetchTime = Date.now();

      return result;
    } catch (error) {
      console.error('Error updating Git config:', error);
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
        ...configUpdates
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

export default new ConfigService();
