import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert } from 'antd';
import {
  CodeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  ReloadOutlined,
  DashboardOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import configService from '../../services/configService';
import dashboardService from '../../services/dashboardService';
import {
  GradientPageHeader,
  ModernCard,
  GRADIENT_THEMES,
} from '../../components/ui/ModernDesignSystem';

// Title destructuring removed as unused

const DashboardPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [hasLeetCodeConfig, setHasLeetCodeConfig] = useState(false);
  const [stats, setStats] = useState({
    totalProblems: 0,
    solvedProblems: 0,
    reviewProblems: 0,
    streakDays: 0,
  });
  const [gitStats, setGitStats] = useState({
    total_records: 0,
    synced_count: 0,
    pending_count: 0,
    failed_count: 0,
    syncing_count: 0,
    retry_count: 0,
    active_tasks: 0,
    progress_percentage: 0,
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

      // Fetch real dashboard statistics
      const basicStats = await dashboardService.getBasicStats();
      setStats({
        totalProblems: basicStats.totalProblems || 0,
        solvedProblems: basicStats.solvedProblems || 0,
        reviewProblems: basicStats.reviewProblems || 0,
        streakDays: basicStats.streakDays || 0,
      });

      // For Git stats, we'll set empty values since there's no specific API for this yet
      setGitStats({
        total_records: basicStats.totalProblems || 0,
        synced_count: basicStats.solvedProblems || 0,
        pending_count: 0,
        failed_count: 0,
        syncing_count: 0,
        retry_count: 0,
        active_tasks: 0,
        progress_percentage:
          basicStats.totalProblems > 0
            ? Math.round(
                (basicStats.solvedProblems / basicStats.totalProblems) * 100,
              )
            : 0,
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
      // Set empty data on error
      setStats({
        totalProblems: 0,
        solvedProblems: 0,
        reviewProblems: 0,
        streakDays: 0,
      });
      setGitStats({
        total_records: 0,
        synced_count: 0,
        pending_count: 0,
        failed_count: 0,
        syncing_count: 0,
        retry_count: 0,
        active_tasks: 0,
        progress_percentage: 0,
      });
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
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: isMobile ? '16px' : '24px',
      }}
    >
      {/* Modern Page Header */}
      <GradientPageHeader
        icon={
          <DashboardOutlined
            style={{
              fontSize: isMobile ? '24px' : '36px',
              color: 'white',
            }}
          />
        }
        title={t('app.dashboard', 'Dashboard')}
        subtitle={
          <>
            <BarChartOutlined
              style={{ fontSize: isMobile ? '16px' : '20px' }}
            />
            {t('app.welcomeToDashboard', 'Welcome to your coding dashboard')}
          </>
        }
        isMobile={isMobile}
        gradient={GRADIENT_THEMES.primary}
        actions={[
          {
            text: t('common.refresh', 'Refresh'),
            type: 'primary',
            icon: <ReloadOutlined />,
            onClick: fetchDashboardData,
            loading: loading,
          },
        ]}
      />

      {/* LeetCode Statistics - Only show if user has LeetCode config */}
      {hasLeetCodeConfig && (
        <ModernCard
          title={t('app.leetcodeStats', 'LeetCode Statistics')}
          icon={<CodeOutlined />}
          iconGradient={GRADIENT_THEMES.info}
          isMobile={isMobile}
          style={{ marginBottom: isMobile ? 16 : 24 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card
                hoverable
                style={{
                  background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                  border: 'none',
                  borderRadius: '12px',
                }}
              >
                <Statistic
                  title={t('app.totalProblems', 'Total Problems')}
                  value={stats.totalProblems}
                  prefix={<CodeOutlined style={{ color: '#1976d2' }} />}
                  valueStyle={{ color: '#1976d2', fontWeight: 'bold' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                hoverable
                style={{
                  background: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)',
                  border: 'none',
                  borderRadius: '12px',
                }}
              >
                <Statistic
                  title={t('app.solvedProblems', 'Solved Problems')}
                  value={stats.solvedProblems}
                  prefix={<CheckCircleOutlined style={{ color: '#388e3c' }} />}
                  valueStyle={{ color: '#388e3c', fontWeight: 'bold' }}
                  suffix={`/ ${stats.totalProblems}`}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                hoverable
                style={{
                  background: 'linear-gradient(135deg, #fff3e0, #ffcc02)',
                  border: 'none',
                  borderRadius: '12px',
                }}
              >
                <Statistic
                  title={t('app.reviewProblems', 'Review Problems')}
                  value={stats.reviewProblems}
                  prefix={<ClockCircleOutlined style={{ color: '#f57c00' }} />}
                  valueStyle={{ color: '#f57c00', fontWeight: 'bold' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                hoverable
                style={{
                  background: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
                  border: 'none',
                  borderRadius: '12px',
                }}
              >
                <Statistic
                  title={t('app.streakDays', 'Streak Days')}
                  value={stats.streakDays}
                  prefix={<TrophyOutlined style={{ color: '#c2185b' }} />}
                  valueStyle={{ color: '#c2185b', fontWeight: 'bold' }}
                  suffix={t('app.days', 'days')}
                />
              </Card>
            </Col>
          </Row>
        </ModernCard>
      )}

      {/* Git Sync Statistics */}
      <ModernCard
        title={t('git.title', 'Git Sync Statistics')}
        icon={<SyncOutlined />}
        iconGradient={GRADIENT_THEMES.success}
        isMobile={isMobile}
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                background: 'linear-gradient(135deg, #e1f5fe, #b3e5fc)',
                border: 'none',
                borderRadius: '12px',
              }}
            >
              <Statistic
                title={t('app.totalSubmissions', 'Total Submissions')}
                value={gitStats.total_records}
                prefix={<CodeOutlined style={{ color: '#0277bd' }} />}
                valueStyle={{ color: '#0277bd', fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                background: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)',
                border: 'none',
                borderRadius: '12px',
              }}
            >
              <Statistic
                title={t('app.syncedCount', 'Synced')}
                value={gitStats.synced_count}
                prefix={<CheckCircleFilled style={{ color: '#2e7d32' }} />}
                valueStyle={{ color: '#2e7d32', fontWeight: 'bold' }}
                suffix={`/ ${gitStats.total_records}`}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                background: 'linear-gradient(135deg, #fff8e1, #ffecb3)',
                border: 'none',
                borderRadius: '12px',
              }}
            >
              <Statistic
                title={t('records.gitSyncStatusPending', 'Pending')}
                value={gitStats.pending_count}
                prefix={<ClockCircleFilled style={{ color: '#f57c00' }} />}
                valueStyle={{ color: '#f57c00', fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                background: 'linear-gradient(135deg, #ffebee, #ffcdd2)',
                border: 'none',
                borderRadius: '12px',
              }}
            >
              <Statistic
                title={t('records.gitSyncStatusFailed', 'Failed')}
                value={gitStats.failed_count}
                prefix={
                  <ExclamationCircleOutlined style={{ color: '#d32f2f' }} />
                }
                valueStyle={{ color: '#d32f2f', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>
      </ModernCard>

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
