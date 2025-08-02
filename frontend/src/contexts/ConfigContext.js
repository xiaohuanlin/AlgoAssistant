import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import configService from '../services/configService';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [configs, setConfigs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConfigs = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const allConfigs = await configService.getAllConfigs(forceRefresh);
      setConfigs(allConfigs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (configUpdates) => {
    try {
      const updatedConfigs = await configService.updateConfigs(configUpdates);
      setConfigs(updatedConfigs);
      return updatedConfigs;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const refreshConfigs = useCallback(async () => {
    configService.clearCache();
    await loadConfigs(true);
  }, [loadConfigs]);

  const getLeetCodeConfig = useCallback(() => {
    return configs?.leetcode_config || null;
  }, [configs]);

  const getGitConfig = useCallback(() => {
    return configs?.github_config || null;
  }, [configs]);

  const getGeminiConfig = useCallback(() => {
    return configs?.gemini_config || null;
  }, [configs]);

  const getNotionConfig = useCallback(() => {
    return configs?.notion_config || null;
  }, [configs]);

  const hasLeetCodeConfig = useCallback(() => {
    const config = getLeetCodeConfig();
    return !!(config && config.session_cookie);
  }, [getLeetCodeConfig]);

  const hasGitConfig = useCallback(() => {
    const config = getGitConfig();
    return !!(config && config.token);
  }, [getGitConfig]);

  const hasGeminiConfig = useCallback(() => {
    const config = getGeminiConfig();
    return !!(config && config.api_key);
  }, [getGeminiConfig]);

  const hasNotionConfig = useCallback(() => {
    const config = getNotionConfig();
    return !!(config && config.token);
  }, [getNotionConfig]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const value = {
    configs,
    loading,
    error,
    loadConfigs,
    updateConfig,
    refreshConfigs,
    getLeetCodeConfig,
    getGitConfig,
    getGeminiConfig,
    getNotionConfig,
    hasLeetCodeConfig,
    hasGitConfig,
    hasGeminiConfig,
    hasNotionConfig,
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};
