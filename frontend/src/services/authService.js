import api from './api';

class AuthService {
  // User registration
  async register(userData) {
    try {
      const response = await api.post('/api/register', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User login
  async login(credentials) {
    try {
      const response = await api.post('/api/login', credentials);
      const { access_token } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', access_token);
      
      // Get user info
      const userInfo = await this.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      return { token: access_token, user: userInfo };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Google login
  async googleLogin(accessToken) {
    try {
      const response = await api.post('/api/google/login', { access_token: accessToken });
      const { access_token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token: access_token, user };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      const response = await api.get('/api/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Get current user from storage
  getCurrentUserFromStorage() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
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

const authService = new AuthService();
export default authService; 