import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

/**
 * @typedef {Object} ReviewOut
 * @property {number} id
 * @property {number} user_id
 * @property {number} problem_id
 * @property {string=} wrong_reason
 * @property {string=} review_plan
 * @property {string} next_review_date
 * @property {number} review_count
 * @property {boolean} notification_sent
 * @property {string=} notification_sent_at
 * @property {string} notification_type
 * @property {string} notification_status
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} ReviewCreate
 * @property {number} problem_id
 * @property {string=} wrong_reason
 * @property {string=} review_plan
 * @property {string=} next_review_date
 * @property {number=} review_count
 */

/**
 * @typedef {Object} ReviewUpdate
 * @property {string=} wrong_reason
 * @property {string=} review_plan
 * @property {string=} next_review_date
 * @property {number=} review_count
 * @property {boolean=} notification_sent
 * @property {string=} notification_sent_at
 * @property {string=} notification_type
 * @property {string=} notification_status
 */

/**
 * Review service class
 * Handles API calls related to review plans
 */
class ReviewService {
  /**
   * Mark problem as wrong and create review plan
   * @param {number} recordId - Record ID
   * @param {Object} reviewData - Review data
   * @param {string} reviewData.wrong_reason - Wrong reason
   * @param {string} reviewData.review_plan - Review plan
   * @returns {Promise<Object>} Review record
   */
  async markAsWrong(recordId, reviewData) {
    try {
      const response = await api.post(API_ENDPOINTS.REVIEW.MARK_WRONG(recordId), reviewData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all review records (with pagination, sorting, filtering)
   * @param {Object} params - Query params: limit, offset, sort_by, sort_order, filters
   * @returns {Promise<{total: number, items: ReviewOut[]}>}
   */
  async getReviews(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.REVIEW.LIST, { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Filter reviews (with pagination, sorting, filtering)
   * @param {Object} params - Query params: limit, offset, sort_by, sort_order, filters
   * @returns {Promise<{total: number, items: ReviewOut[]}>}
   */
  async filterReviews(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.REVIEW.FILTER, { params });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get due review records
   * @returns {Promise<ReviewOut[]>}
   */
  async getDueReviews() {
    try {
      const response = await api.get(API_ENDPOINTS.REVIEW.DUE_REVIEWS);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Mark review as completed
   * @param {number} reviewId
   * @returns {Promise<ReviewOut>}
   */
  async markAsReviewed(reviewId) {
    try {
      const response = await api.post(API_ENDPOINTS.REVIEW.MARK_REVIEWED(reviewId));
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Batch mark reviews as reviewed
   * @param {number[]} ids - Review IDs
   * @returns {Promise<{marked: number}>}
   */
  async batchMarkReviewed(ids) {
    try {
      const response = await api.post(API_ENDPOINTS.REVIEW.BATCH_MARK_REVIEWED, { ids });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Batch delete reviews
   * @param {number[]} ids - Review IDs
   * @returns {Promise<{deleted: number}>}
   */
  async batchDelete(ids) {
    try {
      const response = await api.post(API_ENDPOINTS.REVIEW.BATCH_DELETE, { ids });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete all review plans
   * @returns {Promise<{deleted: number}>}
   */
  async deleteAll() {
    try {
      const response = await api.post(API_ENDPOINTS.REVIEW.DELETE_ALL);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create a new review
   * @param {ReviewCreate} reviewData
   * @returns {Promise<ReviewOut>}
   */
  async createReview(reviewData) {
    try {
      const response = await api.post('/api/review/', reviewData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update a review
   * @param {number} reviewId
   * @param {ReviewUpdate} reviewData
   * @returns {Promise<ReviewOut>}
   */
  async updateReview(reviewId, reviewData) {
    try {
      const response = await api.post(API_ENDPOINTS.REVIEW.BATCH_UPDATE, {
        ids: [reviewId],
        update: reviewData
      });
      return handleApiSuccess(response)[0];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get review statistics
   * @returns {Promise<Object>} Review statistics
   */
  async getReviewStats() {
    try {
      const [reviews, dueReviews] = await Promise.all([
        this.getReviews(),
        this.getDueReviews(),
      ]);
      const totalReviews = reviews.length;
      const dueCount = dueReviews.length;
      const completedCount = reviews.filter(review => review.review_count > 0).length;
      const pendingCount = totalReviews - completedCount;
      return {
        total: totalReviews,
        due: dueCount,
        completed: completedCount,
        pending: pendingCount,
        completionRate: totalReviews > 0 ? Math.round((completedCount / totalReviews) * 100) : 0,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get review statistics from backend
   * @param {number} days - Number of days for trend analysis
   * @returns {Promise<Object>} Review statistics
   */
  async getStats(days = 7) {
    try {
      const response = await api.get(API_ENDPOINTS.REVIEW.STATS, { params: { days } });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Calculate next review date
   * @param {number} reviewCount - Current review count
   * @returns {Date} Next review date
   */
  calculateNextReviewDate(reviewCount) {
    const intervals = [1, 3, 7, 14, 30, 90]; // Review intervals (days)
    const interval = intervals[Math.min(reviewCount, intervals.length - 1)];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    return nextDate;
  }

  /**
   * Format review date
   * @param {string|Date} date - Date
   * @returns {string} Formatted date string
   */
  formatReviewDate(date) {
    const reviewDate = new Date(date);
    const now = new Date();
    const diffTime = reviewDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  }

  /**
   * Get a single review by ID
   * @param {number} reviewId
   * @returns {Promise<ReviewOut>}
   */
  async getReviewById(reviewId) {
    try {
      const response = await api.get(`/api/review/${reviewId}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

const instance = new ReviewService();
export default instance;
