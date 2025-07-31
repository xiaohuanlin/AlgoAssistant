import React from 'react';
import { Empty, Typography, Statistic, Row, Col } from 'antd';
import { Line } from '@ant-design/charts';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const ProgressChart = ({ data = [], height = 300 }) => {
  const { t } = useTranslation();

  // Check if data is empty or all values are zero
  const hasRealData =
    data &&
    data.length > 0 &&
    data.some((item) => (item.solvedCount || item.count || 0) > 0);

  // Only use real data if available
  let chartData = [];

  if (hasRealData) {
    // Transform real data
    chartData = data
      .filter((item) => item && item.date)
      .map((item) => ({
        date: item.date,
        value: Number(item.solvedCount || item.count || 0),
        total: Number(item.totalSubmissions || 0),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
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
  const avgDaily =
    chartData.length > 0 ? (totalSolved / chartData.length).toFixed(1) : 0;
  const maxDaily = Math.max(...chartData.map((item) => item.value));
  const recentValue = chartData[chartData.length - 1]?.value || 0;

  // Fallback to simple statistics if chart fails
  const FallbackChart = () => (
    <div style={{ height, padding: '20px' }}>
      <Text
        strong
        style={{ display: 'block', marginBottom: '16px', textAlign: 'center' }}
      >
        {t('dashboard.progressTrend')} - {t('dashboard.last30Days')}
      </Text>
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title={t('dashboard.totalSolved')}
            value={totalSolved}
            valueStyle={{
              fontSize: '16px',
              color: '#52c41a',
            }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={t('dashboard.avgDaily')}
            value={avgDaily}
            valueStyle={{
              fontSize: '16px',
              color: '#1890ff',
            }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={t('dashboard.maxDaily')}
            value={maxDaily}
            valueStyle={{
              fontSize: '16px',
              color: '#722ed1',
            }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={t('dashboard.recent')}
            value={recentValue}
            valueStyle={{
              fontSize: '16px',
              color: '#fa8c16',
            }}
          />
        </Col>
      </Row>
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {t('dashboard.totalDays')}: {chartData.length} |
          {t('dashboard.dateRange')}: {chartData[0]?.date} -{' '}
          {chartData[chartData.length - 1]?.date}
        </Text>
      </div>

      {/* Simple visual representation */}
      <div style={{ marginTop: '20px', padding: '0 20px' }}>
        <Text
          style={{ fontSize: '13px', marginBottom: '8px', display: 'block' }}
        >
          {t('dashboard.recentTrend')}:
        </Text>
        <div
          style={{
            display: 'flex',
            alignItems: 'end',
            height: '60px',
            gap: '2px',
          }}
        >
          {chartData.slice(-14).map((item, index) => {
            const height = maxDaily > 0 ? (item.value / maxDaily) * 50 + 5 : 5;
            const color = item.value > 0 ? '#1890ff' : '#f0f0f0';
            return (
              <div
                key={index}
                style={{
                  width: '12px',
                  height: `${height}px`,
                  backgroundColor: color,
                  borderRadius: '1px',
                  opacity: 0.8,
                  transition: 'all 0.3s ease',
                }}
                title={`${item.date}: ${item.value}`}
              />
            );
          })}
        </div>
        <Text
          type="secondary"
          style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}
        >
          {t('dashboard.last14Days')}
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
      color: '#1890ff',
      point: {
        size: 3,
        shape: 'circle',
      },
      xAxis: {
        type: 'time',
      },
      yAxis: {
        min: 0,
      },
      tooltip: {
        title: 'date',
        items: [
          {
            field: 'value',
            name: t('records.solvedProblems'),
          },
        ],
      },
    };

    return (
      <div style={{ height }}>
        <Line {...config} />
      </div>
    );
  } catch (error) {
    return <FallbackChart />;
  }
};

export default ProgressChart;
