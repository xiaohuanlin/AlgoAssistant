import api, { API_ENDPOINTS, handleApiError, handleApiSuccess } from './api';

class GoogleService {
  /**
   * Get Google OAuth status
   * @returns {Promise<Object>} OAuth status
   */
  async getOAuthStatus() {
    try {
      const response = await api.get(API_ENDPOINTS.GOOGLE.STATUS);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Start Google OAuth flow
   * @returns {Promise<Object>} OAuth result
   */
  async startOAuth() {
    try {
      const response = await api.get(API_ENDPOINTS.GOOGLE.AUTH);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Handle OAuth callback
   * @param {string} code - Authorization code
   * @param {string} state - State parameter
   * @returns {Promise<Object>} Callback result
   */
  async handleCallback(code, state) {
    try {
      const response = await api.post(API_ENDPOINTS.GOOGLE.CALLBACK, {
        code,
        state
      });
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Disconnect Google OAuth
   * @returns {Promise<Object>} Disconnect result
   */
  async disconnect() {
    try {
      const response = await api.post(API_ENDPOINTS.GOOGLE.DISCONNECT);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Login with Google
   * @returns {Promise<Object>} Login result
   */
  async loginWithGoogle() {
    try {
      const response = await api.post(API_ENDPOINTS.GOOGLE.LOGIN);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Open OAuth popup window
   * @param {string} authUrl - Authorization URL
   * @returns {Promise<Object>} OAuth result
   */
  async openOAuthPopup(authUrl) {
    return new Promise((resolve, reject) => {
      // Generate random state parameter
      const state = Math.random().toString(36).substring(2, 15);

      // Build complete authorization URL
      const url = `${authUrl}&state=${state}`;

      // Open new window for OAuth authorization
      const popup = window.open(url, 'google_oauth', 'width=500,height=600,scrollbars=yes,resizable=yes');

      if (!popup) {
        reject(new Error('Popup blocked by browser'));
        return;
      }

      // Check for callback result
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('OAuth popup closed'));
        }
      }, 1000);

      // Listen for messages from popup
      const handleMessage = (event) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          popup.close();
          resolve(event.data.result);
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          popup.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', handleMessage);
    });
  }

  /**
   * Send success message to parent window
   * @param {Object} result - OAuth result
   */
  sendSuccessToParent(result) {
    if (window.opener) {
      // Send success message to parent window
      window.opener.postMessage({
        type: 'GOOGLE_OAUTH_SUCCESS',
        result
      }, window.location.origin);
    }
  }

  /**
   * Send error message to parent window
   * @param {string} error - Error message
   */
  sendErrorToParent(error) {
    if (window.opener) {
      // Send error message to parent window
      window.opener.postMessage({
        type: 'GOOGLE_OAUTH_ERROR',
        error
      }, window.location.origin);
    }
  }
}

const googleService = new GoogleService();
export default googleService;
