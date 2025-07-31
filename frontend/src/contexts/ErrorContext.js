import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react';
import { notification } from 'antd';

const ErrorContext = createContext();

// Error types
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  SYNC: 'sync',
  CONFIG: 'config',
  UNKNOWN: 'unknown',
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const errorReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload],
        lastError: action.payload,
      };

    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter((error) => error.id !== action.payload),
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: action.payload?.type
          ? state.errors.filter((error) => error.type !== action.payload.type)
          : [],
        lastError: null,
      };

    case 'UPDATE_ERROR':
      return {
        ...state,
        errors: state.errors.map((error) =>
          error.id === action.payload.id
            ? { ...error, ...action.payload.updates }
            : error,
        ),
      };

    default:
      return state;
  }
};

const initialState = {
  errors: [],
  lastError: null,
};

export const ErrorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  // Show notification based on error severity
  const showErrorNotification = useCallback((error) => {
    const config = {
      message: getErrorTitle(error.type),
      description: error.message,
      duration: getNotificationDuration(error.severity),
    };

    switch (error.severity) {
      case ERROR_SEVERITY.CRITICAL:
        notification.error({
          ...config,
          duration: 0, // Don't auto-close critical errors
        });
        break;
      case ERROR_SEVERITY.HIGH:
        notification.error(config);
        break;
      case ERROR_SEVERITY.MEDIUM:
        notification.warning(config);
        break;
      case ERROR_SEVERITY.LOW:
        notification.info(config);
        break;
      default:
        notification.warning(config);
    }
  }, []);

  // Add error to global state
  const addError = useCallback(
    (error) => {
      const errorObj = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: error.type || ERROR_TYPES.UNKNOWN,
        severity: error.severity || ERROR_SEVERITY.MEDIUM,
        message: error.message || 'An unknown error occurred',
        details: error.details || null,
        context: error.context || null,
        stack: error.stack || null,
        resolved: false,
      };

      dispatch({
        type: 'ADD_ERROR',
        payload: errorObj,
      });

      // Show notification based on severity
      showErrorNotification(errorObj);

      // Log error for debugging

      return errorObj.id;
    },
    [showErrorNotification],
  );

  // Remove specific error
  const removeError = useCallback((errorId) => {
    dispatch({
      type: 'REMOVE_ERROR',
      payload: errorId,
    });
  }, []);

  // Clear all errors or errors of specific type
  const clearErrors = useCallback((type = null) => {
    dispatch({
      type: 'CLEAR_ERRORS',
      payload: type ? { type } : null,
    });
  }, []);

  // Mark error as resolved
  const resolveError = useCallback((errorId) => {
    dispatch({
      type: 'UPDATE_ERROR',
      payload: {
        id: errorId,
        updates: { resolved: true },
      },
    });
  }, []);

  // Handle API errors with consistent formatting
  const handleApiError = useCallback(
    (error, context = null) => {
      let errorType = ERROR_TYPES.UNKNOWN;
      let severity = ERROR_SEVERITY.MEDIUM;
      let message = 'An unexpected error occurred';

      // Determine error type and severity
      if (error.response) {
        const status = error.response.status;

        if (status === 401 || status === 403) {
          errorType = ERROR_TYPES.AUTH;
          severity = ERROR_SEVERITY.HIGH;
          message = 'Authentication failed. Please log in again.';
        } else if (status >= 400 && status < 500) {
          errorType = ERROR_TYPES.VALIDATION;
          severity = ERROR_SEVERITY.MEDIUM;
          message = error.response.data?.message || 'Invalid request';
        } else if (status >= 500) {
          errorType = ERROR_TYPES.SERVER;
          severity = ERROR_SEVERITY.HIGH;
          message = 'Server error. Please try again later.';
        }
      } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorType = ERROR_TYPES.NETWORK;
        severity = ERROR_SEVERITY.HIGH;
        message = 'Network error. Please check your connection.';
      }

      return addError({
        type: errorType,
        severity,
        message,
        details: error.response?.data || error.message,
        context,
        stack: error.stack,
      });
    },
    [addError],
  );

  // Handle sync errors specifically
  const handleSyncError = useCallback(
    (error, syncType) => {
      return addError({
        type: ERROR_TYPES.SYNC,
        severity: ERROR_SEVERITY.MEDIUM,
        message: `${syncType} sync failed: ${error.message}`,
        details: error,
        context: { syncType },
      });
    },
    [addError],
  );

  // Handle config errors
  const handleConfigError = useCallback(
    (error, configType) => {
      return addError({
        type: ERROR_TYPES.CONFIG,
        severity: ERROR_SEVERITY.MEDIUM,
        message: `Configuration error for ${configType}: ${error.message}`,
        details: error,
        context: { configType },
      });
    },
    [addError],
  );

  // Get errors by type
  const getErrorsByType = useCallback(
    (type) => {
      return state.errors.filter((error) => error.type === type);
    },
    [state.errors],
  );

  // Get unresolved errors
  const getUnresolvedErrors = useCallback(() => {
    return state.errors.filter((error) => !error.resolved);
  }, [state.errors]);

  const value = {
    // State
    errors: state.errors,
    lastError: state.lastError,

    // Actions
    addError,
    removeError,
    clearErrors,
    resolveError,
    handleApiError,
    handleSyncError,
    handleConfigError,

    // Getters
    getErrorsByType,
    getUnresolvedErrors,
  };

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
};

// Helper functions
const getErrorTitle = (type) => {
  const titles = {
    [ERROR_TYPES.NETWORK]: 'Network Error',
    [ERROR_TYPES.AUTH]: 'Authentication Error',
    [ERROR_TYPES.VALIDATION]: 'Validation Error',
    [ERROR_TYPES.SERVER]: 'Server Error',
    [ERROR_TYPES.SYNC]: 'Sync Error',
    [ERROR_TYPES.CONFIG]: 'Configuration Error',
    [ERROR_TYPES.UNKNOWN]: 'Error',
  };
  return titles[type] || 'Error';
};

const getNotificationDuration = (severity) => {
  switch (severity) {
    case ERROR_SEVERITY.CRITICAL:
      return 0; // Don't auto-close
    case ERROR_SEVERITY.HIGH:
      return 10;
    case ERROR_SEVERITY.MEDIUM:
      return 6;
    case ERROR_SEVERITY.LOW:
      return 4;
    default:
      return 4.5;
  }
};

// Custom hook to use error context
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext;
