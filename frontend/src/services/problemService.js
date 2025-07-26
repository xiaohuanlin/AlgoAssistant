import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class ProblemService {
  /**
   * Get problem list (with filters, pagination, sorting)
   * @param {Object} params - Query params: skip, limit, source, title, tags, difficulty, sort_by, sort_order
   * @returns {Promise<Array>} Problem list
   */
  async getProblems(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.PROBLEM.LIST, { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get problem detail
   * @param {number} problemId
   * @returns {Promise<Object>} Problem detail
   */
  async getProblem(problemId) {
    try {
      const response = await api.get(API_ENDPOINTS.PROBLEM.DETAIL(problemId));
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create a new problem (supports both custom and LeetCode)
   * @param {Object} problemData
   * @returns {Promise<Object>} Created problem
   */
  async createProblem(problemData) {
    try {
      const response = await api.post(API_ENDPOINTS.PROBLEM.CREATE, problemData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update a problem
   * @param {number} problemId
   * @param {Object} updateData
   * @returns {Promise<Object>} Updated problem
   */
  async updateProblem(problemId, updateData) {
    try {
      const response = await api.put(API_ENDPOINTS.PROBLEM.UPDATE(problemId), updateData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete a problem
   * @param {number} problemId
   * @returns {Promise<void>}
   */
  async deleteProblem(problemId) {
    try {
      await api.delete(API_ENDPOINTS.PROBLEM.DELETE(problemId));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Batch create problems
   * @param {Array<Object>} problems
   * @returns {Promise<Array>} Created problems
   */
  async batchCreateProblems(problems) {
    try {
      const response = await api.post(API_ENDPOINTS.PROBLEM.BATCH_CREATE, { problems });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get problem user records and reviews
   * @param {number} problemId
   * @returns {Promise<{records: Array, reviews: Array}>}
   */
  async getProblemUserRecords(problemId) {
    try {
      const response = await api.get(`/api/problem/${problemId}/user-records`);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get problem statistics for current user
   * @param {number} problemId
   * @returns {Promise<Object>} Problem statistics
   */
  async getProblemStats(problemId) {
    try {
      const response = await api.get(`/api/problem/${problemId}/stats`);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get problem-specific statistics for current user
   * @param {number} problemId
   * @returns {Promise<Object>} Problem statistics
   */
  async getProblemStatistics(problemId) {
    try {
      const response = await api.get(`/api/problem/${problemId}/statistics`);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

const problemService = new ProblemService();
export default problemService;
