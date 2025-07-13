import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

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
   * Get all review records
   * @returns {Promise<Array>} Review records list
   */
  async getReviews() {
    try {
      const response = await api.get(API_ENDPOINTS.REVIEW.LIST);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get due review records
   * @returns {Promise<Array>} Due review records list
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
   * @param {number} reviewId - Review record ID
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
}

const instance = new ReviewService();
export default instance;
