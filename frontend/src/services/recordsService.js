import api from './api';

class RecordsService {
  // Get all records
  async getRecords() {
    try {
      const response = await api.get('/api/records');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get single record
  async getRecord(submissionId) {
    try {
      const response = await api.get(`/api/records/${submissionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new record
  async createRecord(recordData) {
    try {
      const response = await api.post('/api/records', recordData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update record
  async updateRecord(submissionId, recordData) {
    try {
      const response = await api.put(`/api/records/${submissionId}`, recordData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete record
  async deleteRecord(submissionId) {
    try {
      const response = await api.delete(`/api/records/${submissionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get statistics
  async getStats() {
    try {
      const response = await api.get('/api/records/stats');
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

const recordsService = new RecordsService();
export default recordsService; 