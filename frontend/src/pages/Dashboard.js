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
  CodeOutlined
} from '@ant-design/icons';
import recordsService from '../services/recordsService';
import leetcodeService from '../services/leetcodeService';

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [syncStats, setSyncStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [statsData, syncData] = await Promise.all([
          recordsService.getStats(),
          leetcodeService.getSyncStatus().catch(() => null)
        ]);
        setStats(statsData);
        setSyncStats(syncData);
      } catch (error) {
        console.error('Error loading stats in Dashboard:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setStats({});
        setSyncStats(null);
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
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.totalSubmissions')}
                value={stats?.total || 0}
                prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.uniqueProblems')}
                value={stats?.unique_problems || 0}
                prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.solvedProblems')}
                value={stats?.solved || 0}
                prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.successRate')}
                value={stats?.successRate || 0}
                suffix="%"
                precision={1}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('app.languages')}
                value={stats?.languages || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* LeetCode同步状态子模块 */}
        {syncStats && (
          <>
            <Divider orientation="left">
              <CodeOutlined style={{ marginRight: 8, color: '#ff6b35' }} />
              {t('app.leetcodeSyncStatus')}
            </Divider>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={t('app.totalToSync')}
                    value={syncStats.total_records || 0}
                    prefix={<SyncOutlined style={{ color: '#722ed1' }} />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={t('app.syncingCount')}
                    value={syncStats.syncing_count || 0}
                    prefix={<LoadingOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={t('app.pendingCount')}
                    value={syncStats.pending_count || 0}
                    prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={t('app.syncedCount')}
                    value={syncStats.synced_count || 0}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}
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