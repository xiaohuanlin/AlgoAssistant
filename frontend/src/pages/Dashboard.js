import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Avatar, Tag, Spin, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  TrophyOutlined,
  BookOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  GithubOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import recordsService from '../services/recordsService';
import leetcodeService from '../services/leetcodeService';
import gitSyncService from '../services/gitSyncService';
import LeetCodeConfig from '../components/LeetCodeConfig';
import GitSyncStatusPage from '../components/GitSyncStatusPage';

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [syncStats, setSyncStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const statsData = await recordsService.getStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error loading stats in Dashboard:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setStats({});
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  // You can add real recent activity API integration here if needed
  const recentActivity = [];

  const getDifficultyColor = (difficulty) => {
    if (!difficulty || typeof difficulty !== 'string') return 'default';
    switch (difficulty) {
      case 'Easy': return 'green';
      case 'Medium': return 'orange';
      case 'Hard': return 'red';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    if (!status || typeof status !== 'string') return 'default';
    return status === 'Accepted' ? 'green' : 'red';
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('app.welcome')}</h1>

      {/* 基础统计信息 */}
      {/* Basic Statistics */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.totalProblems')}
                value={(stats && stats.totalProblems) || 0}
                prefix={<CodeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.solvedProblems')}
                value={(stats && stats.solvedProblems) || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.reviewProblems')}
                value={(stats && stats.reviewProblems) || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.streakDays')}
                value={(stats && stats.streakDays) || 0}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {/* LeetCode同步状态子模块 */}
        {/* LeetCode Sync Status Submodule */}
        {/* <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title={t('app.leetcodeSync')}>
              <LeetCodeConfig />
            </Card>
          </Col>
        </Row> */}

        {/* GitHub同步状态子模块 */}
        {/* GitHub Sync Status Submodule */}
        {/* <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title={t('app.githubSync')}>
              <GitSyncStatusPage />
            </Card>
          </Col>
        </Row> */}
      </Spin>
      {/* Recent Activity (placeholder, can be replaced with real data) */}
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
