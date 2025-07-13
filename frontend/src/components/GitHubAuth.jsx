import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Tag, Typography, Input, Space, message } from 'antd';
import { GithubOutlined, CheckCircleOutlined, DisconnectOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const GitHubAuth = () => {
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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setStatus(response.data);
        } catch (error) {
            console.error('Error checking GitHub status:', error);
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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Open GitHub OAuth in new window
            const authWindow = window.open(
                response.data.auth_url,
                'github-auth',
                'width=600,height=700,scrollbars=yes,resizable=yes'
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
            console.error('Error starting GitHub auth:', error);
            setConnecting(false);
            message.error('GitHub连接失败');
        }
    };

    const disconnectGitHub = async () => {
        try {
            await axios.delete('/api/github/disconnect', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            message.success('GitHub已断开连接');
            checkGitHubStatus();
        } catch (error) {
            console.error('Error disconnecting GitHub:', error);
            message.error('断开连接失败');
        }
    };

    const updateRepo = async () => {
        try {
            await axios.put('/api/github/repo',
                { repo },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setShowRepoInput(false);
            message.success('仓库设置已更新');
            checkGitHubStatus();
        } catch (error) {
            console.error('Error updating repo:', error);
            message.error('更新仓库设置失败');
        }
    };

    if (loading) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div>加载中...</div>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <GithubOutlined style={{ fontSize: '20px', marginRight: '8px', color: '#1890ff' }} />
                    <Title level={4} style={{ margin: 0 }}>GitHub 集成</Title>
                </div>
                <Tag color={status?.connected ? 'success' : 'default'}>
                    {status?.connected ? '已连接' : '未连接'}
                </Tag>
            </div>

            {status?.connected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Alert
                        message="GitHub 已成功连接"
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '6px' }}>
                            <Text strong>GitHub 用户名</Text>
                            <div style={{ fontFamily: 'monospace', marginTop: '4px' }}>{status.username}</div>
                        </div>

                        <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '6px' }}>
                            <Text strong>代码仓库</Text>
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
                                            保存
                                        </Button>
                                        <Button size="small" onClick={() => setShowRepoInput(false)}>
                                            取消
                                        </Button>
                                    </Space>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
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
                                        编辑
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
                            断开连接
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={checkGitHubStatus}
                        >
                            刷新状态
                        </Button>
                    </Space>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Alert
                        message="未连接"
                        description="您尚未连接GitHub账户。连接后可以自动同步代码到GitHub仓库。"
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
                        {connecting ? '连接中...' : '连接GitHub'}
                    </Button>
                </div>
            )}
        </Card>
    );
};

export default GitHubAuth;
