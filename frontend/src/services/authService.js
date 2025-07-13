import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class AuthService {
  /**
   * Register user
   * @param {Object} userData - User data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email
   * @param {string} userData.password - Password
   * @param {string} userData.nickname - Nickname (optional)
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      const response = await api.post(API_ENDPOINTS.USERS.REGISTER, userData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * User login
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.username - Username or email
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>} Login result
   */
  async login(credentials) {
    try {
      const response = await api.post(API_ENDPOINTS.USERS.LOGIN, credentials);
      const result = handleApiSuccess(response);
      // Store token and user info
      this.setAuthData(result.access_token, result.user);
      return result;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Google OAuth login
   * @param {string} accessToken - Google access token
   * @returns {Promise<Object>} Login result
   */
  async googleLogin(accessToken) {
    try {
      const response = await api.post(API_ENDPOINTS.GOOGLE.LOGIN, {
        access_token: accessToken
      });
      const result = handleApiSuccess(response);
      // Store token and user info
      this.setAuthData(result.access_token, result.user);
      return result;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get current user info
   * @returns {Promise<Object>} User info
   */
  async getCurrentUser() {
    try {
      const response = await api.get(API_ENDPOINTS.USERS.ME);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user profile
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile() {
    try {
      const response = await api.get(API_ENDPOINTS.USERS.PROFILE);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update user profile
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(userData) {
    try {
      const response = await api.put(API_ENDPOINTS.USERS.PROFILE, userData);
      const result = handleApiSuccess(response);
      // Update local user info
      const currentUser = this.getCurrentUserFromStorage();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...result };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return result;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user config
   * @returns {Promise<Object>} User config
   */
  async getUserConfig() {
    try {
      const response = await api.get(API_ENDPOINTS.USERS.CONFIG);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create user config
   * @param {Object} config - Config data
   * @returns {Promise<Object>} Create result
   */
  async createUserConfig(config) {
    try {
      const response = await api.post(API_ENDPOINTS.USERS.CONFIG, config);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update user config
   * @param {Object} config - Config data
   * @returns {Promise<Object>} Update result
   */
  async updateUserConfig(config) {
    try {
      const response = await api.put(API_ENDPOINTS.USERS.CONFIG, config);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * User logout
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  /**
   * Check if authenticated
   * @returns {boolean} Whether authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  /**
   * Get current user from local storage
   * @returns {Object|null} User info
   */
  getCurrentUserFromStorage() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Set authentication data
   * @param {string} token - Access token
   * @param {Object} user - User info
   */
  setAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Get access token
   * @returns {string|null} Access token
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Clear authentication data
   */
  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Refresh user info
   * @returns {Promise<Object>} User info
   */
  async refreshUserInfo() {
    try {
      const user = await this.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  /**
   * Validate token
   * @returns {Promise<boolean>} Whether token is valid
   */
  async validateToken() {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }
}

const instance = new AuthService();
export default instance;
