import React, { Suspense, lazy } from 'react';
import { Row, Col, Button, Alert, Spin, Typography } from 'antd';
import { ReloadOutlined, TrophyOutlined, CodeOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useResponsive, useIntersectionObserver } from '../../hooks/useResponsive';
import ResponsiveStatCard from '../../components/dashboard/ResponsiveStatCard';
import CollapsibleCard from '../../components/dashboard/CollapsibleCard';
import './EnhancedDashboardPage.css';

const { Title } = Typography;

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
    refreshBasicStats,
    loadProgressTrend
  } = useDashboardData();

  const { isMobile, isTablet, cardGutter, containerPadding } = useResponsive();

  // Intersection observer for lazy loading charts
  const [chartRef, isChartVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  const getStatsCards = () => {
    if (!basicStats) return [];

    return [
      {
        key: 'total',
        title: t('app.totalProblems'),
        value: basicStats.totalProblems || 0,
        prefix: <CodeOutlined />,
        color: '#1890ff'
      },
      {
        key: 'solved',
        title: t('app.solvedProblems'),
        value: basicStats.solvedProblems || 0,
        prefix: <CheckCircleOutlined />,
        color: '#52c41a',
        suffix: ` / ${basicStats.totalProblems || 0}`
      },
      {
        key: 'review',
        title: t('app.reviewProblems'),
        value: basicStats.reviewProblems || 0,
        prefix: <ClockCircleOutlined />,
        color: '#faad14'
      },
      {
        key: 'streak',
        title: t('app.streakDays'),
        value: basicStats.streakDays || 0,
        prefix: <TrophyOutlined />,
        color: '#f5222d',
        suffix: t('app.days')
      }
    ];
  };

  const renderStatsSection = () => {
    const statsCards = getStatsCards();

    if (isMobile) {
      // Mobile: Single column layout
      return (
        <div className="stats-section-mobile">
          {statsCards.map((stat) => (
            <ResponsiveStatCard
              key={stat.key}
              title={stat.title}
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              color={stat.color}
              loading={isLoading && !basicStats}
            />
          ))}
        </div>
      );
    }

    // Desktop/Tablet: Grid layout
    return (
      <Row gutter={cardGutter} className="stats-section-desktop">
        {statsCards.map((stat) => (
          <Col key={stat.key} xs={24} sm={12} lg={6}>
            <ResponsiveStatCard
              title={stat.title}
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              color={stat.color}
              loading={isLoading && !basicStats}
            />
          </Col>
        ))}
      </Row>
    );
  };

  const renderChartsSection = () => (
    <div ref={chartRef}>
      {isMobile ? (
        // Mobile: Stacked layout with collapsible cards
        <>
          <CollapsibleCard
            title={t('dashboard.categoryAnalysis')}
            priority="secondary"
            defaultExpanded={false}
          >
            <Suspense fallback={<Spin />}>
              {isChartVisible && (
                <CategoryChart data={categoryStats} height={200} />
              )}
            </Suspense>
          </CollapsibleCard>

          <CollapsibleCard
            title={t('dashboard.progressTrend')}
            priority="secondary"
            defaultExpanded={false}
            extra={
              <Button
                size="small"
                onClick={() => loadProgressTrend(7)}
                disabled={isLoading}
              >
                {t('dashboard.lastWeek')}
              </Button>
            }
          >
            <Suspense fallback={<Spin />}>
              {isChartVisible && (
                <ProgressChart data={progressTrend} height={200} />
              )}
            </Suspense>
          </CollapsibleCard>
        </>
      ) : (
        // Desktop: Side-by-side layout
        <Row gutter={cardGutter}>
          <Col xs={24} lg={14}>
            <CollapsibleCard
              title={t('dashboard.categoryAnalysis')}
              priority="important"
            >
              <Suspense fallback={<Spin />}>
                {isChartVisible && (
                  <CategoryChart data={categoryStats} height={300} />
                )}
              </Suspense>
            </CollapsibleCard>
          </Col>
          <Col xs={24} lg={10}>
            <CollapsibleCard
              title={t('dashboard.progressTrend')}
              priority="important"
              extra={
                <Button
                  size="small"
                  onClick={() => loadProgressTrend(30)}
                  disabled={isLoading}
                >
                  {t('dashboard.lastMonth')}
                </Button>
              }
            >
              <Suspense fallback={<Spin />}>
                {isChartVisible && (
                  <ProgressChart data={progressTrend} height={250} />
                )}
              </Suspense>
            </CollapsibleCard>
          </Col>
        </Row>
      )}
    </div>
  );

  const renderActivitySection = () => (
    <Row gutter={cardGutter}>
      <Col xs={24} lg={16}>
        <CollapsibleCard
          title={t('dashboard.recentActivity')}
          priority={isMobile ? "important" : "critical"}
          defaultExpanded={true}
        >
          <Suspense fallback={<Spin />}>
            <RecentActivityList
              data={recentActivity}
              loading={isLoading && !recentActivity?.length}
              mobile={isMobile}
            />
          </Suspense>
        </CollapsibleCard>
      </Col>

      <Col xs={24} lg={8}>
        <CollapsibleCard
          title={t('dashboard.errorAnalysis')}
          priority="expandable"
          defaultExpanded={!isMobile}
        >
          <Suspense fallback={<Spin />}>
            <ErrorAnalysisPanel
              data={errorAnalysis}
              loading={isLoading && !errorAnalysis}
              mobile={isMobile}
            />
          </Suspense>
        </CollapsibleCard>
      </Col>
    </Row>
  );

  const renderHeader = () => (
    <div className="dashboard-header">
      <Title level={isMobile ? 3 : 2} className="dashboard-title">
        {t('app.dashboard')}
      </Title>
      <Button
        type="primary"
        icon={<ReloadOutlined />}
        onClick={refresh}
        loading={isLoading}
        size={isMobile ? "middle" : "large"}
        className="refresh-button"
      >
        {t('common.refresh')}
      </Button>
    </div>
  );

  const renderLoadingState = () => (
    <div className="dashboard-loading">
      <Spin size="large" />
      <p>{t('dashboard.loading')}</p>
    </div>
  );

  const renderErrorState = () => (
    <Alert
      message={t('dashboard.error')}
      description={error}
      type="error"
      showIcon
      action={
        <Button size="small" danger onClick={refresh}>
          {t('common.retry')}
        </Button>
      }
      className="dashboard-error"
    />
  );

  if (isLoading && !basicStats) {
    return renderLoadingState();
  }

  if (hasError && !basicStats) {
    return renderErrorState();
  }

  return (
    <div
      className={`enhanced-dashboard ${isMobile ? 'mobile' : 'desktop'}`}
      style={{ padding: containerPadding }}
    >
      {renderHeader()}

      {/* Basic Statistics */}
      {renderStatsSection()}

      {/* Charts Section */}
      {renderChartsSection()}

      {/* Activity and Errors Section */}
      {renderActivitySection()}

      {/* Error handling for partial failures */}
      {hasError && basicStats && (
        <Alert
          message={t('dashboard.partialError')}
          description={t('dashboard.partialErrorDescription')}
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
