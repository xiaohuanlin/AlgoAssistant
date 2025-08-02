import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class DashboardService {
  /**
   * Get basic statistics for dashboard
   * @returns {Promise<Object>} Basic statistics
   */
  async getBasicStats() {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.BASIC_STATS);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get category statistics for dashboard
   * @returns {Promise<Array>} Category statistics
   */
  async getCategoryStats() {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.CATEGORY_STATS);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get dashboard overview (combined stats)
   * @returns {Promise<Object>} Dashboard overview data
   */
  async getOverview() {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.OVERVIEW);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all dashboard data in parallel
   * @returns {Promise<Object>} Combined dashboard data
   */
  async getAllData() {
    try {
      const [basicStats, categoryStats] = await Promise.all([
        this.getBasicStats(),
        this.getCategoryStats(),
      ]);
      return {
        basicStats,
        categoryStats,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

const dashboardService = new DashboardService();
export default dashboardService;
