import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing loading states with deduplication
 * Prevents multiple loading indicators for the same operation
 */
export const useLoadingState = (initialState = {}) => {
  const [loadingStates, setLoadingStates] = useState(initialState);
  const pendingOperations = useRef(new Set());

  // Set loading state for a specific key
  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  // Start loading for a key
  const startLoading = useCallback(
    (key) => {
      setLoading(key, true);
      pendingOperations.current.add(key);
    },
    [setLoading],
  );

  // Stop loading for a key
  const stopLoading = useCallback(
    (key) => {
      setLoading(key, false);
      pendingOperations.current.delete(key);
    },
    [setLoading],
  );

  // Check if any operation is loading
  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  // Check if specific key is loading
  const isLoading = useCallback(
    (key) => {
      return Boolean(loadingStates[key]);
    },
    [loadingStates],
  );

  // Wrap an async operation with loading state
  const withLoading = useCallback(
    async (key, operation) => {
      // Prevent duplicate operations
      if (pendingOperations.current.has(key)) {
        return;
      }

      try {
        startLoading(key);
        const result = await operation();
        return result;
      } finally {
        stopLoading(key);
      }
    },
    [startLoading, stopLoading],
  );

  // Clear all loading states
  const clearAll = useCallback(() => {
    setLoadingStates({});
    pendingOperations.current.clear();
  }, []);

  // Get all loading states
  const getAllLoading = useCallback(() => {
    return loadingStates;
  }, [loadingStates]);

  return {
    // State getters
    isLoading,
    isAnyLoading,
    getAllLoading,
    loadingStates,

    // State setters
    setLoading,
    startLoading,
    stopLoading,
    clearAll,

    // Operation wrapper
    withLoading,
  };
};

/**
 * Hook for global loading state management
 * Use this for operations that should show global loading indicators
 */
export const useGlobalLoading = () => {
  const { isLoading, isAnyLoading, withLoading, startLoading, stopLoading } =
    useLoadingState();

  const GLOBAL_KEYS = {
    AUTH: 'auth',
    SYNC: 'sync',
    DATA_FETCH: 'dataFetch',
    SUBMIT: 'submit',
    INIT: 'init',
  };

  return {
    // Keys for common operations
    KEYS: GLOBAL_KEYS,

    // State checkers
    isAuthLoading: () => isLoading(GLOBAL_KEYS.AUTH),
    isSyncLoading: () => isLoading(GLOBAL_KEYS.SYNC),
    isDataLoading: () => isLoading(GLOBAL_KEYS.DATA_FETCH),
    isSubmitting: () => isLoading(GLOBAL_KEYS.SUBMIT),
    isInitializing: () => isLoading(GLOBAL_KEYS.INIT),
    isAnyLoading,

    // State setters
    startAuth: () => startLoading(GLOBAL_KEYS.AUTH),
    stopAuth: () => stopLoading(GLOBAL_KEYS.AUTH),
    startSync: () => startLoading(GLOBAL_KEYS.SYNC),
    stopSync: () => stopLoading(GLOBAL_KEYS.SYNC),
    startDataFetch: () => startLoading(GLOBAL_KEYS.DATA_FETCH),
    stopDataFetch: () => stopLoading(GLOBAL_KEYS.DATA_FETCH),
    startSubmit: () => startLoading(GLOBAL_KEYS.SUBMIT),
    stopSubmit: () => stopLoading(GLOBAL_KEYS.SUBMIT),
    startInit: () => startLoading(GLOBAL_KEYS.INIT),
    stopInit: () => stopLoading(GLOBAL_KEYS.INIT),

    // Operation wrapper
    withLoading: (key, operation) => withLoading(key, operation),
  };
};

export default useLoadingState;
