import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class RecordsService {
  /**
   * Get record list
   * @param {Object} filters - Filter parameters
   * @param {string} filters.tag - Single tag filter
   * @param {string} filters.tags - Multiple tags filter (comma separated)
   * @param {string} filters.status - Execution status filter
   * @param {string} filters.oj_type - OJ platform filter
   * @param {string} filters.language - Programming language filter
   * @param {string} filters.problem_title - Problem title search
   * @param {number} filters.problem_id - Problem ID filter
   * @param {string} filters.start_time - Start time
   * @param {string} filters.end_time - End time
   * @param {number} filters.limit - Limit
   * @param {number} filters.offset - Offset
   * @param {string} filters.sort_by - Sort field
   * @param {string} filters.sort_order - Sort order
   * @returns {Promise<Array>} Record list
   */
  async getRecords(filters = {}) {
    try {
      // Multi-value params to support
      const multiParams = ['status', 'oj_sync_status', 'github_sync_status', 'ai_sync_status'];
      const params = { ...filters };
      // Convert array params to repeated query params
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (multiParams.includes(key) && Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, value);
        }
      });
      const response = await api.get(API_ENDPOINTS.RECORDS.LIST + '?' + searchParams.toString());
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get a specific record
   * @param {number} recordId - Record ID
   * @returns {Promise<Object>} Record detail
   */
  async getRecord(recordId) {
    try {
      const response = await api.get(API_ENDPOINTS.RECORDS.DETAIL(recordId));
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create a record
   * @param {Object} recordData - Record data
   * @returns {Promise<Object>} Created record
   */
  async createRecord(recordData) {
    try {
      const response = await api.post(API_ENDPOINTS.RECORDS.CREATE, recordData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update a record
   * @param {number} recordId - Record ID
   * @param {Object} recordData - Update data
   * @returns {Promise<Object>} Updated record
   */
  async updateRecord(recordId, recordData) {
    try {
      const response = await api.put(API_ENDPOINTS.RECORDS.UPDATE(recordId), recordData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete a record
   * @param {number} recordId - Record ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteRecord(recordId) {
    try {
      const response = await api.delete(API_ENDPOINTS.RECORDS.DELETE(recordId));
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStats() {
    try {
      const response = await api.get(API_ENDPOINTS.RECORDS.STATS);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all tags
   * @returns {Promise<Array>} Tag list
   */
  async getTags() {
    try {
      const response = await api.get(API_ENDPOINTS.RECORDS.TAGS);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Assign tags to a record
   * @param {number} recordId - Record ID
   * @param {Array<string>} tagNames - Tag name list
   * @returns {Promise<Object>} Updated record
   */
  async assignTags(recordId, tagNames) {
    try {
      const response = await api.post(API_ENDPOINTS.RECORDS.ASSIGN_TAGS(recordId), {
        tag_names: tagNames
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update tag wiki
   * @param {number} tagId - Tag ID
   * @param {string} wiki - Wiki content
   * @returns {Promise<Object>} Updated tag
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
   * Batch get records
   * @param {Array<number>} recordIds - Record ID list
   * @returns {Promise<Array>} Record list
   */
  async getRecordsByIds(recordIds) {
    try {
      const promises = recordIds.map(id => this.getRecord(id));
      return await Promise.all(promises);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Search records
   * @param {string} query - Search query
   * @param {Object} filters - Extra filters
   * @returns {Promise<Array>} Search result
   */
  async searchRecords(query, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        problem_title: query
      };
      return await this.getRecords(searchFilters);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get execution status text
   * @param {string} status - Execution status
   * @returns {string} Status text
   */
  getExecutionStatusText(status) {
    const statusMap = {
      'Accepted': '通过',
      'Wrong Answer': '答案错误',
      'Time Limit Exceeded': '超时',
      'Memory Limit Exceeded': '内存超限',
      'Runtime Error': '运行时错误',
      'Compilation Error': '编译错误',
      'Presentation Error': '格式错误',
    };
    return statusMap[status] || status;
  }

  /**
   * Get execution status color
   * @param {string} status - Execution status
   * @returns {string} Status color
   */
  getExecutionStatusColor(status) {
    const colorMap = {
      'Accepted': 'success',
      'Wrong Answer': 'error',
      'Time Limit Exceeded': 'warning',
      'Memory Limit Exceeded': 'warning',
      'Runtime Error': 'error',
      'Compilation Error': 'error',
      'Presentation Error': 'warning',
    };
    return colorMap[status] || 'default';
  }

  /**
   * Get language color
   * @param {string} language - Programming language
   * @returns {string} Language color
   */
  getLanguageColor(language) {
    const colorMap = {
      'python': 'green',
      'java': 'orange',
      'cpp': 'blue',
      'javascript': 'yellow',
      'typescript': 'cyan',
      'go': 'purple',
      'rust': 'red',
    };
    return colorMap[language.toLowerCase()] || 'default';
  }

  /**
   * Get OJ type color
   * @param {string} ojType - OJ type
   * @returns {string} OJ type color
   */
  getOJTypeColor(ojType) {
    const colorMap = {
      'leetcode': 'orange',
      'nowcoder': 'blue',
      'other': 'default',
    };
    return colorMap[ojType] || 'default';
  }

  /**
   * Get difficulty color
   * @param {string} difficulty - Difficulty level
   * @returns {string} Difficulty color
   */
  getDifficultyColor(difficulty) {
    const colorMap = {
      'Easy': 'green',
      'Medium': 'orange',
      'Hard': 'red',
    };
    return colorMap[difficulty] || 'default';
  }

  /**
   * Format runtime
   * @param {number} runtime - Runtime (ms)
   * @returns {string} Formatted runtime
   */
  formatRuntime(runtime) {
    if (!runtime) return 'N/A';
    if (runtime < 1000) return `${runtime}ms`;
    return `${(runtime / 1000).toFixed(2)}s`;
  }

  /**
   * Format memory usage
   * @param {number} memory - Memory usage (bytes)
   * @returns {string} Formatted memory usage
   */
  formatMemory(memory) {
    if (!memory) return 'N/A';
    if (memory < 1024) return `${memory}B`;
    if (memory < 1024 * 1024) return `${(memory / 1024).toFixed(1)}KB`;
    return `${(memory / (1024 * 1024)).toFixed(1)}MB`;
  }
}

const instance = new RecordsService();
export default instance;
