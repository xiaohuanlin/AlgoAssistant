import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert, Button } from 'antd';
import {
  ReloadOutlined,
  TrophyOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useResponsive } from '../../hooks/useResponsive';
import {
  GradientPageHeader,
  ModernCard,
  GRADIENT_THEMES
} from '../../components/ui/ModernDesignSystem';

// Lazy load heavy components for better performance
const CategoryChart = lazy(() => import('../../components/dashboard/CategoryChart'));
const ProgressChart = lazy(() => import('../../components/dashboard/ProgressChart'));
const RecentActivityList = lazy(() => import('../../components/dashboard/RecentActivityList'));
const ErrorAnalysisPanel = lazy(() => import('../../components/dashboard/ErrorAnalysisPanel'));

const EnhancedDashboardPage = () => {
  const { t } = useTranslation();
  const {
    basicStats,
    categoryStats,
    recentActivity,
    errorAnalysis,
    progressTrend,
    isLoading,
    hasError,
    error,
    refresh,
    loadProgressTrend
  } = useDashboardData();

  const { isMobile, cardGutter, containerPadding } = useResponsive();

  const getStatsCards = () => {
    if (!basicStats) return [];

    return [
      {
        key: 'total',
        title: t('app.totalProblems', 'Total Problems'),
        value: basicStats.totalProblems || 0,
        prefix: <CodeOutlined />,
        gradient: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
        color: '#1976d2'
      },
      {
        key: 'solved',
        title: t('app.solvedProblems', 'Solved Problems'),
        value: basicStats.solvedProblems || 0,
        suffix: ` / ${basicStats.totalProblems || 0}`,
        prefix: <CheckCircleOutlined />,
        gradient: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)',
        color: '#388e3c'
      },
      {
        key: 'review',
        title: t('app.reviewProblems', 'Review Problems'),
        value: basicStats.reviewProblems || 0,
        prefix: <ClockCircleOutlined />,
        gradient: 'linear-gradient(135deg, #fff3e0, #ffcc02)',
        color: '#f57c00'
      },
      {
        key: 'streak',
        title: t('app.streakDays', 'Streak Days'),
        value: basicStats.streakDays || 0,
        suffix: t('app.days', 'days'),
        prefix: <TrophyOutlined />,
        gradient: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
        color: '#c2185b'
      }
    ];
  };

  if (isLoading && !basicStats) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" />
        <span style={{ marginLeft: 16 }}>
          {t('dashboard.loading', 'Loading dashboard data...')}
        </span>
      </div>
    );
  }

  if (hasError && !basicStats) {
    return (
      <Alert
        message={t('dashboard.error', 'Error loading dashboard')}
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={refresh}>
            {t('common.retry', 'Retry')}
          </Button>
        }
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: containerPadding
    }}>
      {/* Modern Page Header */}
      <GradientPageHeader
        icon={<DashboardOutlined style={{
          fontSize: isMobile ? '24px' : '36px',
          color: 'white'
        }} />}
        title={t('app.dashboard', 'Dashboard')}
        subtitle={t('app.welcomeToDashboard', 'Welcome to your algorithm learning dashboard')}
        isMobile={isMobile}
        gradient={GRADIENT_THEMES.primary}
        actions={[
          {
            text: t('common.refresh', 'Refresh'),
            type: 'primary',
            icon: <ReloadOutlined />,
            onClick: refresh,
            loading: isLoading
          }
        ]}
      />

      {/* Statistics Section */}
      <ModernCard
        title={t('dashboard.statistics', 'Statistics')}
        icon={<BarChartOutlined />}
        iconGradient={GRADIENT_THEMES.info}
        isMobile={isMobile}
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        <Row gutter={cardGutter}>
          {getStatsCards().map((stat) => (
            <Col key={stat.key} xs={24} sm={12} lg={6}>
              <Card
                hoverable
                loading={isLoading && !basicStats}
                style={{
                  background: stat.gradient,
                  border: 'none',
                  borderRadius: '12px'
                }}
              >
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={React.cloneElement(stat.prefix, { style: { color: stat.color } })}
                  suffix={stat.suffix}
                  valueStyle={{ color: stat.color, fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </ModernCard>

      {/* Charts Section */}
      <Row gutter={cardGutter} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} lg={14}>
          <ModernCard
            title={t('dashboard.categoryAnalysis', 'Category Analysis')}
            icon={<PieChartOutlined />}
            iconGradient={GRADIENT_THEMES.warning}
            isMobile={isMobile}
          >
            <Suspense fallback={<Spin />}>
              {categoryStats && categoryStats.length > 0 ? (
                <CategoryChart data={categoryStats} height={isMobile ? 200 : 300} />
              ) : (
                <div style={{
                  height: isMobile ? 200 : 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999'
                }}>
                  <PieChartOutlined style={{ fontSize: 48, marginRight: 16 }} />
                  {t('dashboard.noData', 'No data available')}
                </div>
              )}
            </Suspense>
          </ModernCard>
        </Col>
        
        <Col xs={24} lg={10}>
          <ModernCard
            title={t('dashboard.progressTrend', 'Progress Trend')}
            icon={<LineChartOutlined />}
            iconGradient={GRADIENT_THEMES.success}
            isMobile={isMobile}
            extra={
              <Button
                size="small"
                onClick={() => loadProgressTrend(isMobile ? 7 : 30)}
                disabled={isLoading}
              >
                {isMobile ? t('dashboard.lastWeek', 'Last Week') : t('dashboard.lastMonth', 'Last Month')}
              </Button>
            }
          >
            <Suspense fallback={<Spin />}>
              {progressTrend && progressTrend.length > 0 ? (
                <ProgressChart data={progressTrend} height={isMobile ? 200 : 250} />
              ) : (
                <div style={{
                  height: isMobile ? 200 : 250,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999'
                }}>
                  <LineChartOutlined style={{ fontSize: 48, marginRight: 16 }} />
                  {t('dashboard.noData', 'No data available')}
                </div>
              )}
            </Suspense>
          </ModernCard>
        </Col>
      </Row>

      {/* Activity Section */}
      <Row gutter={cardGutter}>
        <Col xs={24} lg={16}>
          <ModernCard
            title={t('dashboard.recentActivity', 'Recent Activity')}
            icon={<HistoryOutlined />}
            iconGradient={GRADIENT_THEMES.cyan}
            isMobile={isMobile}
          >
            <Suspense fallback={<Spin />}>
              {recentActivity && recentActivity.length > 0 ? (
                <RecentActivityList
                  data={recentActivity}
                  loading={isLoading && !recentActivity?.length}
                  mobile={isMobile}
                />
              ) : (
                <div style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999'
                }}>
                  <HistoryOutlined style={{ fontSize: 48, marginRight: 16 }} />
                  {t('dashboard.noRecentActivity', 'No recent activity')}
                </div>
              )}
            </Suspense>
          </ModernCard>
        </Col>

        <Col xs={24} lg={8}>
          <ModernCard
            title={t('dashboard.errorAnalysis', 'Error Analysis')}
            icon={<ExclamationCircleOutlined />}
            iconGradient={GRADIENT_THEMES.danger}
            isMobile={isMobile}
          >
            <Suspense fallback={<Spin />}>
              {errorAnalysis ? (
                <ErrorAnalysisPanel
                  data={errorAnalysis}
                  loading={isLoading && !errorAnalysis}
                  mobile={isMobile}
                />
              ) : (
                <div style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999'
                }}>
                  <ExclamationCircleOutlined style={{ fontSize: 48, marginRight: 16 }} />
                  {t('dashboard.noErrors', 'No errors found')}
                </div>
              )}
            </Suspense>
          </ModernCard>
        </Col>
      </Row>

      {/* Error handling for partial failures */}
      {hasError && basicStats && (
        <Alert
          message={t('dashboard.partialError', 'Partial Load Error')}
          description={t('dashboard.partialErrorDescription', 'Some data could not be loaded')}
          type="warning"
          closable
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
};

export default EnhancedDashboardPage;