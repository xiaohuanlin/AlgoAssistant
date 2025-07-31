import React from 'react';
import { Empty, Progress, Row, Col, Typography } from 'antd';
import { Pie } from '@ant-design/charts';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const CategoryChart = ({ data = [], height = 300 }) => {
  const { t } = useTranslation();

  // Check if there's real data
  const hasRealData =
    data &&
    data.length > 0 &&
    data.some((item) => (item.totalCount || item.count || item.value || 0) > 0);

  // Only use real data if available
  let chartData = [];

  if (hasRealData) {
    chartData = data
      .filter((item) => item && (item.category || item.name))
      .map((item) => ({
        type: String(item.category || item.name || 'Unknown'),
        value: Number(item.totalCount || item.count || item.value || 0),
      }))
      .filter((item) => item.value > 0);
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
      '#5B8FF9',
      '#5AD8A6',
      '#5D7092',
      '#F6BD16',
      '#E8684A',
      '#6DC8EC',
      '#9270CA',
      '#FF9D4D',
      '#269A99',
      '#FF99C3',
    ];

    return (
      <div style={{ height, padding: '20px' }}>
        <Text
          strong
          style={{
            display: 'block',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          {t('dashboard.categoryAnalysis')}
        </Text>
        <Row gutter={[8, 8]}>
          {chartData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const color = colors[index % colors.length];
            return (
              <Col span={24} key={item.type}>
                <div style={{ marginBottom: '8px' }}>
                  <Text style={{ fontSize: '12px' }}>
                    {item.type}: {item.value} ({percentage}%)
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
      </div>
    );
  };

  try {
    const config = {
      data: chartData,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      tooltip: {
        title: 'type',
        items: [
          {
            field: 'value',
            name: t('records.totalSubmissions'),
          },
        ],
      },
      legend: {
        position: 'bottom',
      },
    };

    return (
      <div style={{ height }}>
        <Pie {...config} />
      </div>
    );
  } catch (error) {
    return <FallbackChart />;
  }
};

export default CategoryChart;
