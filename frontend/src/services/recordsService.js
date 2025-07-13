import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class RecordsService {
  /**
   * 获取记录列表
   * @param {Object} filters - 过滤参数
   * @param {string} filters.tag - 单个标签过滤
   * @param {string} filters.tags - 多个标签过滤（逗号分隔）
   * @param {string} filters.status - 执行状态过滤
   * @param {string} filters.oj_type - OJ平台过滤
   * @param {string} filters.language - 编程语言过滤
   * @param {string} filters.problem_title - 题目标题搜索
   * @param {number} filters.problem_id - 题目ID过滤
   * @param {string} filters.start_time - 开始时间
   * @param {string} filters.end_time - 结束时间
   * @param {number} filters.limit - 限制数量
   * @param {number} filters.offset - 偏移量
   * @param {string} filters.sort_by - 排序字段
   * @param {string} filters.sort_order - 排序方向
   * @returns {Promise<Array>} 记录列表
   */
  async getRecords(filters = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.RECORDS.LIST, { params: filters });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 获取特定记录
   * @param {number} recordId - 记录ID
   * @returns {Promise<Object>} 记录详情
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
   * 创建记录
   * @param {Object} recordData - 记录数据
   * @returns {Promise<Object>} 创建的记录
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
   * 更新记录
   * @param {number} recordId - 记录ID
   * @param {Object} recordData - 更新数据
   * @returns {Promise<Object>} 更新后的记录
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
   * 删除记录
   * @param {number} recordId - 记录ID
   * @returns {Promise<Object>} 删除结果
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
   * 获取统计信息
   * @returns {Promise<Object>} 统计信息
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
   * 获取所有标签
   * @returns {Promise<Array>} 标签列表
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
   * 为记录分配标签
   * @param {number} recordId - 记录ID
   * @param {Array<string>} tagNames - 标签名称列表
   * @returns {Promise<Object>} 更新后的记录
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
   * 更新标签Wiki
   * @param {number} tagId - 标签ID
   * @param {string} wiki - Wiki内容
   * @returns {Promise<Object>} 更新后的标签
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
   * 批量获取记录
   * @param {Array<number>} recordIds - 记录ID列表
   * @returns {Promise<Array>} 记录列表
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
   * 搜索记录
   * @param {string} query - 搜索查询
   * @param {Object} filters - 额外过滤条件
   * @returns {Promise<Array>} 搜索结果
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
   * 获取执行结果状态文本
   * @param {string} status - 执行状态
   * @returns {string} 状态文本
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
   * 获取执行结果状态颜色
   * @param {string} status - 执行状态
   * @returns {string} 状态颜色
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
   * 获取编程语言颜色
   * @param {string} language - 编程语言
   * @returns {string} 语言颜色
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
   * 获取OJ平台颜色
   * @param {string} ojType - OJ平台类型
   * @returns {string} 平台颜色
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
   * 获取难度颜色
   * @param {string} difficulty - 难度等级
   * @returns {string} 难度颜色
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
   * 格式化运行时间
   * @param {number} runtime - 运行时间（毫秒）
   * @returns {string} 格式化的运行时间
   */
  formatRuntime(runtime) {
    if (!runtime) return 'N/A';
    if (runtime < 1000) return `${runtime}ms`;
    return `${(runtime / 1000).toFixed(2)}s`;
  }

  /**
   * 格式化内存使用
   * @param {number} memory - 内存使用（字节）
   * @returns {string} 格式化的内存使用
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
