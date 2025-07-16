import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Avatar, Tag, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  TrophyOutlined,
  BookOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  UserOutlined,
  RobotOutlined
} from '@ant-design/icons';
import recordsService from '../services/recordsService';
import leetcodeService from '../services/leetcodeService';
import configService from '../services/configService';
import syncTaskService from '../services/syncTaskService';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leetcodeProfile, setLeetCodeProfile] = useState(null);
  const [leetcodeLoading, setLeetCodeLoading] = useState(false);
  const [leetcodeError, setLeetCodeError] = useState(null);
  const [hasLeetCodeConfig, setHasLeetCodeConfig] = useState(false);
  const [geminiStats, setGeminiStats] = useState(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [hasGeminiConfig, setHasGeminiConfig] = useState(false);

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

    const checkLeetCodeConfig = async () => {
      try {
        const leetcodeConfig = await configService.getLeetCodeConfig();
        const hasConfig = leetcodeConfig && leetcodeConfig.session_cookie;
        setHasLeetCodeConfig(hasConfig);

        // Only load LeetCode profile if user has config
        if (hasConfig) {
          const loadLeetCodeProfile = async () => {
            setLeetCodeLoading(true);
            setLeetCodeError(null);
            try {
              const res = await leetcodeService.getLeetCodeProfile();
              setLeetCodeProfile(res);
            } catch (err) {
              setLeetCodeError(err.message || 'Failed to load LeetCode profile');
            } finally {
              setLeetCodeLoading(false);
            }
          };
          loadLeetCodeProfile();
        }
      } catch (error) {
        console.error('Error checking LeetCode config:', error);
        setHasLeetCodeConfig(false);
      }
    };
    checkLeetCodeConfig();

    const checkGeminiConfig = async () => {
      try {
        const geminiConfig = await configService.getGeminiConfig();
        const hasConfig = geminiConfig && geminiConfig.api_key;
        setHasGeminiConfig(hasConfig);

        // Only load Gemini stats if user has config
        if (hasConfig) {
          const loadGeminiStats = async () => {
            setGeminiLoading(true);
            try {
              const stats = await syncTaskService.getTaskStats();
              const geminiTaskStats = stats.gemini_sync || { total: 0, completed: 0, failed: 0 };
              setGeminiStats(geminiTaskStats);
            } catch (err) {
              console.error('Error loading Gemini stats:', err);
              setGeminiStats({ total: 0, completed: 0, failed: 0 });
            } finally {
              setGeminiLoading(false);
            }
          };
          loadGeminiStats();
        }
      } catch (error) {
        console.error('Error checking Gemini config:', error);
        setHasGeminiConfig(false);
      }
    };
    checkGeminiConfig();
  }, [t]);

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
      </Spin>
      {/* LeetCode Profile Card - Only show if user has LeetCode config */}
      {hasLeetCodeConfig && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Card title="LeetCode" loading={leetcodeLoading}>
              {leetcodeError ? (
                <div style={{ color: 'red' }}>{leetcodeError}</div>
              ) : leetcodeProfile ? (
                <div
                  className="leetcode-profile-content"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 90,
                    flexWrap: 'wrap',
                  }}
                >
                  <Avatar
                    size={64}
                    src={leetcodeProfile.user_avatar}
                    icon={<UserOutlined />}
                    style={{ marginRight: 24, flexShrink: 0, marginBottom: 12 }}
                  />
                  <div
                    style={{
                      flex: 1,
                      minWidth: 180,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: 20,
                        textAlign: 'center',
                        marginBottom: 8,
                        wordBreak: 'break-all',
                      }}
                    >
                      {leetcodeProfile.username}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 16,
                        marginBottom: 4,
                        flexWrap: 'wrap',
                        fontSize: 14,
                      }}
                    >
                      <span style={{ color: '#52c41a', fontWeight: 600 }}>AC: {leetcodeProfile.total_ac_count ?? '-'}</span>
                      <span style={{ color: '#1890ff', fontWeight: 600 }}>Submissions: {leetcodeProfile.total_submissions ?? '-'}</span>
                      <span style={{ color: '#faad14', fontWeight: 600 }}>Ranking: {leetcodeProfile.ranking ?? '-'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#999' }}>No LeetCode data</div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* Gemini Report Card - Only show if user has Gemini config */}
      {hasGeminiConfig && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Card title="Gemini AI Analysis" loading={geminiLoading} extra={<a onClick={() => navigate('/gemini')}>{t('settings.geminiIntegration')}</a>}>
              {geminiStats ? (
                <div style={{ display: 'flex', alignItems: 'center', minHeight: 90 }}>
                  <Avatar
                    size={64}
                    icon={<RobotOutlined />}
                    style={{ marginRight: 24, flexShrink: 0, backgroundColor: '#1890ff' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 20, textAlign: 'center', marginBottom: 8 }}>AI Analysis</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 4 }}>
                      <span style={{ color: '#52c41a', fontWeight: 600 }}>Completed: {geminiStats.completed || 0}</span>
                      <span style={{ color: '#1890ff', fontWeight: 600 }}>Total: {geminiStats.total || 0}</span>
                      <span style={{ color: '#ff4d4f', fontWeight: 600 }}>Failed: {geminiStats.failed || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#999' }}>No Gemini analysis data</div>
              )}
            </Card>
          </Col>
        </Row>
      )}
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
