import React from 'react';
import { Empty, Typography, Statistic, Row, Col, Alert } from 'antd';
import { Line } from '@ant-design/charts';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const ProgressChart = ({ data = [], height = 300 }) => {
  const { t } = useTranslation();

  // Check if data is empty or all values are zero
  const hasRealData = data && data.length > 0 && data.some(item =>
    (item.solvedCount || item.count || 0) > 0
  );

  // Generate demo data if no real data exists
  const generateDemoData = () => {
    const demoData = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      // Generate some sample progression data
      const baseValue = Math.max(0, Math.floor(Math.random() * 3) + (i < 15 ? Math.floor(Math.random() * 2) : 0));
      demoData.push({
        date: date.toISOString().split('T')[0],
        value: baseValue,
        total: baseValue + Math.floor(Math.random() * 2)
      });
    }
    return demoData;
  };

  // Use real data if available, otherwise use demo data
  let chartData;
  let isDemo = false;

  if (hasRealData) {
    // Transform real data
    chartData = data
      .filter(item => item && item.date)
      .map(item => ({
        date: item.date,
        value: Number(item.solvedCount || item.count || 0),
        total: Number(item.totalSubmissions || 0)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  } else {
    // Use demo data
    chartData = generateDemoData();
    isDemo = true;
  }

  if (chartData.length === 0) {
    return (
      <Empty
        description={t('dashboard.noData')}
        style={{ padding: '40px 0' }}
      />
    );
  }

  // Calculate statistics
  const totalSolved = chartData.reduce((sum, item) => sum + item.value, 0);
  const avgDaily = chartData.length > 0 ? (totalSolved / chartData.length).toFixed(1) : 0;
  const maxDaily = Math.max(...chartData.map(item => item.value));
  const recentValue = chartData[chartData.length - 1]?.value || 0;

  // Fallback to simple statistics if chart fails
  const FallbackChart = () => (
    <div style={{ height, padding: '20px' }}>
      {isDemo && (
        <Alert
          message={t('dashboard.demoDataNotice')}
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
          closable
        />
      )}

      <Text strong style={{ display: 'block', marginBottom: '16px', textAlign: 'center' }}>
        {t('dashboard.progressTrend')} - {t('dashboard.last30Days')}
        {isDemo && ` (${t('dashboard.demoData')})`}
      </Text>
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title={t('dashboard.totalSolved')}
            value={totalSolved}
            valueStyle={{ fontSize: '16px', color: isDemo ? '#faad14' : '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={t('dashboard.avgDaily')}
            value={avgDaily}
            valueStyle={{ fontSize: '16px', color: isDemo ? '#faad14' : '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={t('dashboard.maxDaily')}
            value={maxDaily}
            valueStyle={{ fontSize: '16px', color: isDemo ? '#faad14' : '#722ed1' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={t('dashboard.recent')}
            value={recentValue}
            valueStyle={{ fontSize: '16px', color: isDemo ? '#faad14' : '#fa8c16' }}
          />
        </Col>
      </Row>
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {t('dashboard.totalDays')}: {chartData.length} |
          {t('dashboard.dateRange')}: {chartData[0]?.date} - {chartData[chartData.length - 1]?.date}
        </Text>
      </div>

      {/* Simple visual representation */}
      <div style={{ marginTop: '20px', padding: '0 20px' }}>
        <Text style={{ fontSize: '13px', marginBottom: '8px', display: 'block' }}>
          {t('dashboard.recentTrend')}:
        </Text>
        <div style={{ display: 'flex', alignItems: 'end', height: '60px', gap: '2px' }}>
          {chartData.slice(-14).map((item, index) => {
            const height = maxDaily > 0 ? (item.value / maxDaily) * 50 + 5 : 5;
            const color = isDemo ? '#faad14' : (item.value > 0 ? '#1890ff' : '#f0f0f0');
            return (
              <div
                key={index}
                style={{
                  width: '12px',
                  height: `${height}px`,
                  backgroundColor: color,
                  borderRadius: '1px',
                  opacity: isDemo ? 0.6 : 0.8,
                  transition: 'all 0.3s ease'
                }}
                title={`${item.date}: ${item.value}${isDemo ? ` (${t('dashboard.demo')})` : ''}`}
              />
            );
          })}
        </div>
        <Text type="secondary" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>
          {t('dashboard.last14Days')}
          {isDemo && ` - ${t('dashboard.demoData')}`}
        </Text>
      </div>
    </div>
  );

  // Enhanced chart configuration with maximum compatibility
  try {
    const config = {
      data: chartData,
      xField: 'date',
      yField: 'value',
      smooth: true,
      color: isDemo ? '#faad14' : '#1890ff',
      point: {
        size: 3,
        shape: 'circle'
      },
      xAxis: {
        type: 'time'
      },
      yAxis: {
        min: 0
      },
      tooltip: {
        title: 'date',
        items: [
          {
            field: 'value',
            name: t('records.solvedProblems')
          }
        ]
      }
    };

    return (
      <div style={{ height }}>
        {isDemo && (
          <Alert
            message={t('dashboard.demoDataNotice')}
            description={t('dashboard.demoDataDescription')}
            type="info"
            showIcon
            style={{ marginBottom: '12px' }}
            closable
          />
        )}
        <Line {...config} />
        {isDemo && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('dashboard.demoDataHint')}
            </Text>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('ProgressChart Line error:', error);
    return <FallbackChart />;
  }
};

export default ProgressChart;
