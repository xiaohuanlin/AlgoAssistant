import React from 'react';
import { Card, Row, Col, Statistic, List, Avatar, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  TrophyOutlined,
  BookOutlined,
  ClockCircleOutlined,
  FireOutlined
} from '@ant-design/icons';

const Dashboard = () => {
  const { t } = useTranslation();

  // Mock data - replace with real API calls
  const stats = [
    {
      title: t('app.totalProblems'),
      value: 150,
      icon: <BookOutlined style={{ color: '#1890ff' }} />
    },
    {
      title: t('app.solvedProblems'),
      value: 89,
      icon: <TrophyOutlined style={{ color: '#52c41a' }} />
    },
    {
      title: t('app.reviewProblems'),
      value: 12,
      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />
    },
    {
      title: t('app.streakDays'),
      value: 7,
      suffix: ` ${t('app.days')}`,
      icon: <FireOutlined style={{ color: '#f5222d' }} />
    }
  ];

  const recentActivity = [
    {
      id: 1,
      title: 'Two Sum',
      status: 'Accepted',
      language: 'Python',
      time: '2 hours ago',
      difficulty: 'Easy'
    },
    {
      id: 2,
      title: 'Add Two Numbers',
      status: 'Accepted',
      language: 'JavaScript',
      time: '1 day ago',
      difficulty: 'Medium'
    },
    {
      id: 3,
      title: 'Longest Substring Without Repeating Characters',
      status: 'Wrong Answer',
      language: 'Python',
      time: '2 days ago',
      difficulty: 'Medium'
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'green';
      case 'Medium': return 'orange';
      case 'Hard': return 'red';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    return status === 'Accepted' ? 'green' : 'red';
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('app.welcome')}</h1>
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                prefix={stat.icon}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('app.recentActivity')}>
            <List
              itemLayout="horizontal"
              dataSource={recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<BookOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{item.title}</span>
                        <Tag color={getDifficultyColor(item.difficulty)}>{item.difficulty}</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                        <Tag>{item.language}</Tag>
                        <span style={{ color: '#999', marginLeft: 8 }}>{item.time}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title={t('app.learningProgress')}>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: '#999' }}>{t('app.noLearningProgress')}</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 