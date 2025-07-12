import api from './api';

class LeetCodeService {
  // Get LeetCode configuration
  async getConfig() {
    try {
      const response = await api.get('/api/config');
      return response.data;
    } catch (error) {
      // If config doesn't exist, return null instead of throwing error
      if (error.response?.status === 404) {
        return null;
      }
      throw this.handleError(error);
    }
  }

  // Update LeetCode configuration
  async updateConfig(configData) {
    try {
      const response = await api.put('/api/config', configData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Start LeetCode sync
  async startSync() {
    try {
      const response = await api.post('/api/leetcode/sync');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get sync status
  async getSyncStatus() {
    try {
      const response = await api.get('/api/leetcode/sync/progress');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get sync progress
  async getSyncProgress() {
    try {
      const response = await api.get('/api/leetcode/sync/progress');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Stop sync
  async stopSync() {
    try {
      const response = await api.post('/api/leetcode/sync/stop');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get sync logs
  async getSyncLogs() {
    try {
      const response = await api.get('/api/leetcode/sync/logs');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get LeetCode user profile
  async getLeetCodeProfile(username = null) {
    try {
      const params = username ? { username } : {};
      const response = await api.get('/api/leetcode/profile', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Test connection
  async testConnection() {
    try {
      const response = await api.get('/api/leetcode/test-connection');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    if (error.response?.data?.detail) {
      return new Error(error.response.data.detail);
    }
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return new Error('Network error, please try again later');
  }
}

const leetcodeService = new LeetCodeService();
export default leetcodeService; 