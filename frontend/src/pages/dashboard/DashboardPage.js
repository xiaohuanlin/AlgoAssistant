import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Spin, Alert, Button } from 'antd';
import {
  CodeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  ReloadOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import configService from '../../services/configService';

const { Title } = Typography;

const DashboardPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLeetCodeConfig, setHasLeetCodeConfig] = useState(false);
  const [stats, setStats] = useState({
    totalProblems: 0,
    solvedProblems: 0,
    reviewProblems: 0,
    streakDays: 0
  });
  const [gitStats, setGitStats] = useState({
    total_records: 0,
    synced_count: 0,
    pending_count: 0,
    failed_count: 0,
    syncing_count: 0,
    retry_count: 0,
    active_tasks: 0,
    progress_percentage: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check LeetCode config first
      const leetcodeConfig = await configService.getLeetCodeConfig();
      const hasConfig = leetcodeConfig && leetcodeConfig.session_cookie;
      setHasLeetCodeConfig(hasConfig);

      // Use mock data to avoid calling non-existent APIs
      setGitStats({
        total_records: 156,
        synced_count: 89,
        pending_count: 12,
        failed_count: 3,
        syncing_count: 2,
        retry_count: 1,
        active_tasks: 1
      });

      // Fetch other dashboard statistics
      // For now, use mock data
      setStats({
        totalProblems: 156,
        solvedProblems: 89,
        reviewProblems: 12,
        streakDays: 7
      });

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div className="dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>{t('app.dashboard')}</Title>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchDashboardData}
          loading={loading}
        >
          {t('common.refresh')}
        </Button>
      </div>

      {/* LeetCode Statistics - Only show if user has LeetCode config */}
      {hasLeetCodeConfig && (
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.totalProblems')}
                value={stats.totalProblems}
                prefix={<CodeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.solvedProblems')}
                value={stats.solvedProblems}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
                suffix={`/ ${stats.totalProblems}`}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.reviewProblems')}
                value={stats.reviewProblems}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.streakDays')}
                value={stats.streakDays}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#f5222d' }}
                suffix={t('app.days')}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Git Sync Statistics */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Title level={3}>{t('git.title')}</Title>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('app.totalSubmissions')}
              value={gitStats.total_records}
              prefix={<CodeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('app.syncedCount')}
              value={gitStats.synced_count}
              prefix={<CheckCircleFilled />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${gitStats.total_records}`}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('records.gitSyncStatusPending')}
              value={gitStats.pending_count}
              prefix={<ClockCircleFilled />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('records.gitSyncStatusFailed')}
              value={gitStats.failed_count}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Git Sync Progress */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('records.gitSyncStatusSyncing')}
              value={gitStats.syncing_count}
              prefix={<SyncOutlined spin={gitStats.syncing_count > 0} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('records.gitSyncStatusRetry')}
              value={gitStats.retry_count}
              prefix={<SyncOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('git.activeTasks')}
              value={gitStats.active_tasks}
              prefix={<SyncOutlined spin={gitStats.active_tasks > 0} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('leetcode.syncProgress')}
              value={gitStats.progress_percentage}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={t('app.recentActivity')} size="small">
            <p>{t('app.noRecentActivity')}</p>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t('app.learningProgress')} size="small">
            <p>{t('app.noLearningProgress')}</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
