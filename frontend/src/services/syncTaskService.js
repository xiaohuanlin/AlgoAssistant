import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class SyncTaskService {
  /**
   * 创建同步任务
   * @param {Object} taskData - 任务数据
   * @param {string} taskData.type - 任务类型 (github_sync, leetcode_batch_sync, leetcode_detail_sync, notion_sync, ai_analysis)
   * @param {Array<number>} taskData.record_ids - 记录ID列表
   * @returns {Promise<Object>} 创建的任务
   */
  async createTask(taskData) {
    try {
      const response = await api.post(API_ENDPOINTS.SYNC_TASKS.CREATE, taskData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 获取同步任务列表
   * @param {Object} params - 查询参数
   * @param {string} params.type - 任务类型过滤
   * @param {string} params.status - 任务状态过滤
   * @param {number} params.limit - 限制数量
   * @param {number} params.offset - 偏移量
   * @returns {Promise<Array>} 任务列表
   */
  async getTasks(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.SYNC_TASKS.LIST, { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 获取特定任务详情
   * @param {number} taskId - 任务ID
   * @returns {Promise<Object>} 任务详情
   */
  async getTask(taskId) {
    try {
      const response = await api.get(API_ENDPOINTS.SYNC_TASKS.DETAIL(taskId));
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 删除同步任务
   * @param {number} taskId - 任务ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteTask(taskId) {
    try {
      await api.delete(API_ENDPOINTS.SYNC_TASKS.DELETE(taskId));
      return true;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 获取任务统计信息
   * @returns {Promise<Object>} 任务统计
   */
  async getTaskStats() {
    try {
      const tasks = await this.getTasks({ limit: 1000 });

      const stats = {
        total: tasks.length,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        paused: 0,
      };

      tasks.forEach(task => {
        if (stats.hasOwnProperty(task.status)) {
          stats[task.status]++;
        }
      });

      return stats;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 创建GitHub同步任务
   * @param {Array<number>} recordIds - 记录ID列表
   * @returns {Promise<Object>} 创建的任务
   */
  async createGitHubSyncTask(recordIds) {
    return this.createTask({
      type: 'github_sync',
      record_ids: recordIds,
    });
  }

  /**
   * 创建LeetCode批量同步任务
   * @param {Object} params - 同步参数
   * @returns {Promise<Object>} 创建的任务
   */
  async createLeetCodeBatchSyncTask(params = {}) {
    return this.createTask({
      type: 'leetcode_batch_sync',
      ...params,
    });
  }

  /**
   * 创建LeetCode详细同步任务
   * @param {Array<number>} recordIds - 记录ID列表
   * @returns {Promise<Object>} 创建的任务
   */
  async createLeetCodeDetailSyncTask(recordIds) {
    return this.createTask({
      type: 'leetcode_detail_sync',
      record_ids: recordIds,
    });
  }

  /**
   * 创建Notion同步任务
   * @param {Array<number>} recordIds - 记录ID列表
   * @returns {Promise<Object>} 创建的任务
   */
  async createNotionSyncTask(recordIds) {
    return this.createTask({
      type: 'notion_sync',
      record_ids: recordIds,
    });
  }

  /**
   * 创建AI分析任务
   * @param {Array<number>} recordIds - 记录ID列表
   * @returns {Promise<Object>} 创建的任务
   */
  async createAIAnalysisTask(recordIds) {
    return this.createTask({
      type: 'ai_analysis',
      record_ids: recordIds,
    });
  }

  /**
   * 获取任务状态文本
   * @param {string} status - 任务状态
   * @returns {string} 状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'pending': '等待中',
      'running': '运行中',
      'completed': '已完成',
      'failed': '失败',
      'paused': '已暂停',
    };
    return statusMap[status] || status;
  }

  /**
   * 获取任务状态颜色
   * @param {string} status - 任务状态
   * @returns {string} 状态颜色
   */
  getStatusColor(status) {
    const colorMap = {
      'pending': 'default',
      'running': 'processing',
      'completed': 'success',
      'failed': 'error',
      'paused': 'warning',
    };
    return colorMap[status] || 'default';
  }

  /**
   * 获取任务类型文本
   * @param {string} type - 任务类型
   * @returns {string} 类型文本
   */
  getTypeText(type) {
    const typeMap = {
      'github_sync': 'GitHub同步',
      'leetcode_batch_sync': 'LeetCode批量同步',
      'leetcode_detail_sync': 'LeetCode详细同步',
      'notion_sync': 'Notion同步',
      'ai_analysis': 'AI分析',
    };
    return typeMap[type] || type;
  }

  /**
   * 检查任务是否可以取消
   * @param {string} status - 任务状态
   * @returns {boolean} 是否可以取消
   */
  canCancel(status) {
    return ['pending', 'running'].includes(status);
  }

  /**
   * 检查任务是否可以重试
   * @param {string} status - 任务状态
   * @returns {boolean} 是否可以重试
   */
  canRetry(status) {
    return ['failed', 'paused'].includes(status);
  }
}

const instance = new SyncTaskService();
export default instance;
