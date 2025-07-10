import React from 'react';
import { Row, Col, Card, Statistic, Typography, Space } from 'antd';
import { 
  CodeOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  TrophyOutlined 
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const DashboardPage = () => {
  const { t } = useTranslation();
  
  // Mock data - can be fetched from API
  const stats = {
    totalProblems: 156,
    solvedProblems: 89,
    reviewProblems: 12,
    streakDays: 7
  };

  return (
    <div className="dashboard-page">
      <Title level={2}>{t('app.dashboard')}</Title>
      
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