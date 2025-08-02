import React, { createContext, useContext, useState, useEffect } from 'react';
import gitSyncService from '../services/gitSyncService';
import authService from '../services/authService';

const GitSyncContext = createContext();

export const useGitSync = () => {
  const context = useContext(GitSyncContext);
  if (!context) {
    throw new Error('useGitSync must be used within a GitSyncProvider');
  }
  return context;
};

export const GitSyncProvider = ({ children }) => {
  const [syncState, setSyncState] = useState({
    isRunning: false,
    progress: 0,
    totalRecords: 0,
    syncedRecords: 0,
    failedRecords: 0,
  });

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load Git configuration
  const loadConfig = async () => {
    setLoading(true);
    try {
      const configData = await gitSyncService.getGitConfig();
      setConfig(configData);
    } catch (error) {
      // Ignore config load errors
    } finally {
      setLoading(false);
    }
  };

  // Start sync
  const startSync = async (recordIds, options = {}) => {
    setSyncState((prev) => ({ ...prev, isRunning: true }));
    try {
      const response = await gitSyncService.syncToGit(recordIds, options);
      return response;
    } catch (error) {
      setSyncState((prev) => ({ ...prev, isRunning: false }));
      throw error;
    }
  };

  // Stop sync
  const stopSync = async (taskId) => {
    await gitSyncService.stopSync(taskId);
    setSyncState((prev) => ({ ...prev, isRunning: false }));
  };

  // Resume sync
  const resumeSync = async (taskId) => {
    await gitSyncService.resumeSync(taskId);
    setSyncState((prev) => ({ ...prev, isRunning: true }));
  };

  // Retry failed records
  const retryFailedRecords = async (taskId) => {
    await gitSyncService.retryFailedRecords(taskId);
    setSyncState((prev) => ({ ...prev, isRunning: true }));
  };

  // Update sync status
  const updateSyncStatus = (status) => {
    setSyncState((prev) => ({ ...prev, ...status }));
  };

  // Load config on mount only if user is authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadConfig();
    }
  }, []);

  // Listen for authentication changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          // User logged in, load config
          loadConfig();
        } else {
          // User logged out, clear config
          setConfig(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check on focus in case of same-tab login
    const handleFocus = () => {
      if (authService.isAuthenticated() && !config) {
        loadConfig();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [config]);

  const value = {
    syncState,
    config,
    loading,
    startSync,
    stopSync,
    resumeSync,
    retryFailedRecords,
    updateSyncStatus,
    loadConfig,
    setConfig,
  };

  return (
    <GitSyncContext.Provider value={value}>{children}</GitSyncContext.Provider>
  );
};
