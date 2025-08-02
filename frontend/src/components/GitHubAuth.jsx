import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Alert,
  Tag,
  Typography,
  Input,
  Space,
  message,
} from 'antd';
import {
  GithubOutlined,
  CheckCircleOutlined,
  DisconnectOutlined,
  ReloadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const { Title, Text } = Typography;

const GitHubAuth = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [repo, setRepo] = useState('');
  const [showRepoInput, setShowRepoInput] = useState(false);

  useEffect(() => {
    checkGitHubStatus();
  }, []);

  const checkGitHubStatus = async () => {
    try {
      const response = await axios.get('/api/github/status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStatus(response.data);
    } catch (error) {
      setStatus({ connected: false, message: 'Error checking status' });
    } finally {
      setLoading(false);
    }
  };

  const connectGitHub = async () => {
    setConnecting(true);
    try {
      const response = await axios.get('/api/github/auth', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Open GitHub OAuth in new window
      const authWindow = window.open(
        response.data.auth_url,
        'github-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes',
      );

      // Poll for window close
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          setConnecting(false);
          checkGitHubStatus(); // Refresh status
        }
      }, 1000);
    } catch (error) {
      setConnecting(false);
      message.error(t('git.connectionFailed') || 'GitHub connection failed');
    }
  };

  const disconnectGitHub = async () => {
    try {
      await axios.delete('/api/github/disconnect', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      message.success(
        t('git.disconnectSuccess') || 'GitHub disconnected successfully',
      );
      checkGitHubStatus();
    } catch (error) {
      message.error(t('git.disconnectError') || 'Failed to disconnect');
    }
  };

  const updateRepo = async () => {
    try {
      await axios.put(
        '/api/github/repo',
        { repo },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      setShowRepoInput(false);
      message.success(
        t('git.repoUpdateSuccess') || 'Repository settings updated',
      );
      checkGitHubStatus();
    } catch (error) {
      message.error(
        t('git.repoUpdateError') || 'Failed to update repository settings',
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div>{t('common.loading') || 'Loading...'}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <GithubOutlined
            style={{ fontSize: '20px', marginRight: '8px', color: '#1890ff' }}
          />
          <Title level={4} style={{ margin: 0 }}>
            {t('git.integration') || 'GitHub Integration'}
          </Title>
        </div>
        <Tag color={status?.connected ? 'success' : 'default'}>
          {status?.connected
            ? t('git.connected') || 'Connected'
            : t('git.notConnected') || 'Not Connected'}
        </Tag>
      </div>

      {status?.connected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Alert
            message={
              t('git.connectionSuccess') || 'GitHub connected successfully'
            }
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: '16px',
                borderRadius: '6px',
              }}
            >
              <Text strong>{t('git.username') || 'GitHub Username'}</Text>
              <div style={{ fontFamily: 'monospace', marginTop: '4px' }}>
                {status.username}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: '16px',
                borderRadius: '6px',
              }}
            >
              <Text strong>{t('git.repository') || 'Repository'}</Text>
              {showRepoInput ? (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="username/repo-name"
                    style={{ marginBottom: '8px' }}
                  />
                  <Space>
                    <Button size="small" type="primary" onClick={updateRepo}>
                      {t('common.save') || 'Save'}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setShowRepoInput(false)}
                    >
                      {t('common.cancel') || 'Cancel'}
                    </Button>
                  </Space>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                  }}
                >
                  <div style={{ fontFamily: 'monospace' }}>{status.repo}</div>
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setRepo(status.repo);
                      setShowRepoInput(true);
                    }}
                  >
                    {t('common.edit') || 'Edit'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Space>
            <Button
              danger
              icon={<DisconnectOutlined />}
              onClick={disconnectGitHub}
            >
              {t('git.disconnect') || 'Disconnect'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={checkGitHubStatus}>
              {t('git.refreshStatus') || 'Refresh Status'}
            </Button>
          </Space>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Alert
            message={t('git.notConnected') || 'Not Connected'}
            description={
              t('git.notConnectedDesc') ||
              'You have not connected your GitHub account yet. After connecting, you can automatically sync code to GitHub repository.'
            }
            type="info"
            showIcon
          />

          <Button
            type="primary"
            icon={<GithubOutlined />}
            loading={connecting}
            onClick={connectGitHub}
            style={{ width: 'fit-content' }}
          >
            {connecting
              ? t('git.connecting') || 'Connecting...'
              : t('git.connectGitHub') || 'Connect GitHub'}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default GitHubAuth;
