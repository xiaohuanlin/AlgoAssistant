import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, message } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
  CalendarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatLocalTime } from '../../utils';
import ResponsiveStatCard from '../dashboard/ResponsiveStatCard';
import problemService from '../../services/problemService';

const ProblemStatistics = ({ problemId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalAttempts: 0,
    successfulAttempts: 0,
    successRate: 0,
    bestTime: null,
    bestMemory: null,
    totalReviews: 0,
    lastAttemptDate: null,
  });

  const fetchStatistics = async () => {
    if (!problemId) return;

    setLoading(true);
    try {
      const data = await problemService.getProblemStatistics(problemId);
      setStatistics({
        totalAttempts: data.total_attempts || 0,
        successfulAttempts: data.successful_attempts || 0,
        successRate: data.success_rate || 0,
        bestTime: data.best_time || null,
        bestMemory: data.best_memory || null,
        totalReviews: data.total_reviews || 0,
        lastAttemptDate: data.last_attempt_date || null,
      });
    } catch (error) {
      message.error(t('problem.statisticsLoadError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  const formatSuccessRate = (rate) => {
    if (statistics.totalAttempts === 0) return 0;
    return Math.round(rate * 100);
  };

  const formatTime = (timeMs) => {
    if (!timeMs) return '-';
    if (timeMs < 1000) return `${timeMs}ms`;
    return `${(timeMs / 1000).toFixed(2)}s`;
  };

  const formatMemory = (memoryKb) => {
    if (!memoryKb) return '-';
    if (memoryKb < 1024) return `${memoryKb}KB`;
    return `${(memoryKb / 1024).toFixed(2)}MB`;
  };

  const formatLastAttemptDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('problem.today');
    if (diffDays === 1) return t('problem.yesterday');
    if (diffDays < 7) return t('problem.daysAgo', { days: diffDays });
    return formatLocalTime(date, 'YYYY-MM-DD');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="problem-statistics" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <ResponsiveStatCard
            title={t('problem.totalAttempts')}
            value={statistics.totalAttempts}
            prefix={<PlayCircleOutlined />}
            color="#1890ff"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <ResponsiveStatCard
            title={t('problem.successRate')}
            value={formatSuccessRate(statistics.successRate)}
            suffix="%"
            prefix={<CheckCircleOutlined />}
            color={
              statistics.successRate >= 0.7
                ? '#52c41a'
                : statistics.successRate >= 0.4
                  ? '#faad14'
                  : '#f5222d'
            }
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <ResponsiveStatCard
            title={t('problem.totalReviews')}
            value={statistics.totalReviews}
            prefix={<BookOutlined />}
            color="#722ed1"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <ResponsiveStatCard
            title={t('problem.bestTime')}
            value={formatTime(statistics.bestTime)}
            prefix={<ClockCircleOutlined />}
            color="#13c2c2"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <ResponsiveStatCard
            title={t('problem.bestMemory')}
            value={formatMemory(statistics.bestMemory)}
            prefix={<TrophyOutlined />}
            color="#eb2f96"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <ResponsiveStatCard
            title={t('problem.lastAttempt')}
            value={formatLastAttemptDate(statistics.lastAttemptDate)}
            prefix={<CalendarOutlined />}
            color="#fa8c16"
            loading={loading}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ProblemStatistics;
