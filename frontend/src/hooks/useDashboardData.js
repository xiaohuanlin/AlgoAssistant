import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';
import api from '../services/api';
import { useResponsive } from './useResponsive';

// const MOBILE_PRIORITY_CONFIG = {
//   critical: ['basicStats'],
//   important: ['recentActivity'],
//   secondary: ['categoryStats', 'progressTrend'],
//   expandable: ['errorAnalysis']
// };

export const useDashboardData = () => {
  const { isMobile } = useResponsive();
  const [dashboardData, setDashboardData] = useState({
    basicStats: null,
    categoryStats: [],
    recentActivity: [],
    errorAnalysis: null,
    progressTrend: [],
    loading: true,
    error: null
  });

  const fetchBasicStats = useCallback(async () => {
    try {
      return await dashboardService.getBasicStats();
    } catch (error) {
      throw new Error(error.message || 'Failed to load basic stats');
    }
  }, []);

  const fetchCategoryStats = useCallback(async () => {
    try {
      return await dashboardService.getCategoryStats();
    } catch (error) {
      throw new Error(error.message || 'Failed to load category stats');
    }
  }, []);

  const fetchRecentActivity = useCallback(async (limit = 10) => {
    try {
      const response = await api.get(`/api/dashboard/activity/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to load recent activity');
    }
  }, []);

  const fetchErrorAnalysis = useCallback(async () => {
    try {
      const response = await api.get('/api/dashboard/errors/analysis');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to load error analysis');
    }
  }, []);

  const fetchProgressTrend = useCallback(async (days = 30) => {
    try {
      const response = await api.get(`/api/dashboard/progress/trend?days=${days}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to load progress trend');
    }
  }, []);

  const fetchDashboardOverview = useCallback(async () => {
    try {
      const response = await api.get('/api/dashboard/overview');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to load dashboard overview');
    }
  }, []);

  // Progressive loading for mobile
  const loadDashboardDataProgressive = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Load critical data immediately
      const basicStats = await fetchBasicStats();
      setDashboardData(prev => ({ ...prev, basicStats }));

      // Load important data with delay for mobile
      if (isMobile) {
        setTimeout(async () => {
          try {
            const recentActivity = await fetchRecentActivity(5); // Fewer items on mobile
            setDashboardData(prev => ({ ...prev, recentActivity }));
          } catch (error) {
            console.error('Failed to load recent activity:', error);
          }
        }, 300);

        // Load secondary data with longer delay
        setTimeout(async () => {
          try {
            const [categoryStats, errorAnalysis, progressTrend] = await Promise.all([
              fetchCategoryStats(),
              fetchErrorAnalysis(),
              fetchProgressTrend(7)
            ]);
            setDashboardData(prev => ({
              ...prev,
              categoryStats,
              errorAnalysis,
              progressTrend,
              loading: false
            }));
          } catch (error) {
            setDashboardData(prev => ({
              ...prev,
              error: error.message,
              loading: false
            }));
          }
        }, 800);
      } else {
        // Desktop: Load all data in parallel
        const [categoryStats, recentActivity, errorAnalysis, progressTrend] = await Promise.all([
          fetchCategoryStats(),
          fetchRecentActivity(10),
          fetchErrorAnalysis(),
          fetchProgressTrend(30)
        ]);

        setDashboardData(prev => ({
          ...prev,
          categoryStats,
          recentActivity,
          errorAnalysis,
          progressTrend,
          loading: false
        }));
      }
    } catch (error) {
      setDashboardData(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  }, [isMobile, fetchBasicStats, fetchCategoryStats, fetchRecentActivity, fetchErrorAnalysis, fetchProgressTrend]);

  // Fast loading for desktop (all at once)
  const loadDashboardDataFast = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const overview = await fetchDashboardOverview();
      setDashboardData(prev => ({
        ...prev,
        ...overview,
        loading: false
      }));
    } catch (error) {
      setDashboardData(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  }, [fetchDashboardOverview]);

  // Load progress trend separately (for charts)
  const loadProgressTrend = useCallback(async (days = 30) => {
    try {
      const progressTrend = await fetchProgressTrend(days);
      setDashboardData(prev => ({ ...prev, progressTrend }));
    } catch (error) {
      console.error('Failed to load progress trend:', error);
    }
  }, [fetchProgressTrend]);

  // Main fetch function
  const fetchDashboardData = useCallback(() => {
    if (isMobile) {
      loadDashboardDataProgressive();
    } else {
      loadDashboardDataFast();
    }
  }, [isMobile, loadDashboardDataProgressive, loadDashboardDataFast]);

  // Refresh specific data sections
  const refreshBasicStats = useCallback(async () => {
    try {
      const basicStats = await fetchBasicStats();
      setDashboardData(prev => ({ ...prev, basicStats }));
    } catch (error) {
      console.error('Failed to refresh basic stats:', error);
    }
  }, [fetchBasicStats]);

  const refreshRecentActivity = useCallback(async () => {
    try {
      const limit = isMobile ? 5 : 10;
      const recentActivity = await fetchRecentActivity(limit);
      setDashboardData(prev => ({ ...prev, recentActivity }));
    } catch (error) {
      console.error('Failed to refresh recent activity:', error);
    }
  }, [fetchRecentActivity, isMobile]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    ...dashboardData,
    refresh: fetchDashboardData,
    refreshBasicStats,
    refreshRecentActivity,
    loadProgressTrend,
    isLoading: dashboardData.loading,
    hasError: !!dashboardData.error
  };
};

// Hook for individual dashboard sections
export const useDashboardSection = (sectionName, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSection = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      switch (sectionName) {
        case 'basicStats':
          response = await api.get('/api/dashboard/stats/basic');
          break;
        case 'categoryStats':
          response = await api.get('/api/dashboard/stats/categories');
          break;
        case 'recentActivity':
          response = await api.get('/api/dashboard/activity/recent');
          break;
        case 'errorAnalysis':
          response = await api.get('/api/dashboard/errors/analysis');
          break;
        case 'progressTrend':
          response = await api.get('/api/dashboard/progress/trend');
          break;
        default:
          throw new Error(`Unknown section: ${sectionName}`);
      }
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionName, ...dependencies]);

  useEffect(() => {
    fetchSection();
  }, [fetchSection]);

  return {
    data,
    loading,
    error,
    refresh: fetchSection
  };
};
