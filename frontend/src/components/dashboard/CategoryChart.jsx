import React from 'react';
import { Empty, Progress, Row, Col, Typography, Alert } from 'antd';
import { Pie } from '@ant-design/charts';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const CategoryChart = ({ data = [], height = 300 }) => {
  const { t } = useTranslation();

  // Check if there's real data
  const hasRealData = data && data.length > 0 && data.some(item =>
    (item.totalCount || item.count || item.value || 0) > 0
  );

  // Generate demo data if no real data exists
  const generateDemoData = () => {
    const categories = [
      { name: t('dashboard.algorithms'), count: 15 },
      { name: t('dashboard.dataStructures'), count: 12 },
      { name: t('dashboard.dynamicProgramming'), count: 8 },
      { name: t('dashboard.greedy'), count: 6 },
      { name: t('dashboard.twoPointers'), count: 5 },
      { name: t('dashboard.binarySearch'), count: 4 }
    ];

    return categories.map(cat => ({
      category: cat.name,
      totalCount: cat.count
    }));
  };

  // Use real data if available, otherwise use demo data
  let chartData;
  let isDemo = false;

  if (hasRealData) {
    chartData = data
      .filter(item => item && (item.category || item.name))
      .map(item => ({
        type: String(item.category || item.name || 'Unknown'),
        value: Number(item.totalCount || item.count || item.value || 0)
      }))
      .filter(item => item.value > 0);
  } else {
    const demoData = generateDemoData();
    chartData = demoData.map(item => ({
      type: item.category,
      value: item.totalCount
    }));
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

  const FallbackChart = () => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const colors = [
      '#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E8684A',
      '#6DC8EC', '#9270CA', '#FF9D4D', '#269A99', '#FF99C3'
    ];

    return (
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
          {t('dashboard.categoryAnalysis')}
          {isDemo && ` (${t('dashboard.demoData')})`}
        </Text>
        <Row gutter={[8, 8]}>
          {chartData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const color = isDemo ? '#faad14' : colors[index % colors.length];
            return (
              <Col span={24} key={item.type}>
                <div style={{ marginBottom: '8px' }}>
                  <Text style={{ fontSize: '12px' }}>
                    {item.type}: {item.value} ({percentage}%)
                    {isDemo && ` ${t('dashboard.demo')}`}
                  </Text>
                  <Progress
                    percent={Number(percentage)}
                    strokeColor={color}
                    size="small"
                    showInfo={false}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </Col>
            );
          })}
        </Row>
        {isDemo && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {t('dashboard.demoDataHint')}
            </Text>
          </div>
        )}
      </div>
    );
  };

  try {
    const config = {
      data: chartData,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      color: isDemo ? ['#faad14', '#ffc53d', '#ffd666', '#ffe58f', '#fff1b8', '#fffbe6'] : undefined,
      tooltip: {
        title: 'type',
        items: [
          {
            field: 'value',
            name: t('records.totalSubmissions')
          }
        ]
      },
      legend: {
        position: 'bottom'
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
        <Pie {...config} />
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
    console.error('CategoryChart Pie error:', error);
    return <FallbackChart />;
  }
};

export default CategoryChart;
