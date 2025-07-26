import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Alert, Tabs } from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  BookOutlined,
  RobotOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CodeOutlined,
  GithubOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { ConfigCard } from '../components/common';
import LeetCodeIntegrationModal from '../components/LeetCodeIntegrationModal';
import GitHubIntegrationModal from '../components/GitHubIntegrationModal';
import NotionIntegrationModal from '../components/NotionIntegrationModal';
import configService from '../services/configService';
import authService from '../services/authService';

import GeminiIntegrationModal from '../components/GeminiIntegrationModal';
import { useConfig } from '../contexts/ConfigContext';
import NotificationConfigModal from '../components/NotificationConfigModal';

const { Title, Text } = Typography;

const Settings = () => {
    const { t } = useTranslation();
    const { refreshConfigs } = useConfig();
    const [gitConfig, setGitConfig] = useState(null);
    const [leetcodeConfig, setLeetCodeConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [leetcodeModalVisible, setLeetCodeModalVisible] = useState(false);
    const [githubModalVisible, setGithubModalVisible] = useState(false);
    const [notionConfig, setNotionConfig] = useState(null);
    const [notionModalVisible, setNotionModalVisible] = useState(false);
    const [geminiConfig, setGeminiConfig] = useState(null);
    const [geminiModalVisible, setGeminiModalVisible] = useState(false);
    const [notificationConfig, setNotificationConfig] = useState(null);
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);

    useEffect(() => {
        if (authService.isAuthenticated()) {
            loadConfigs();
        }
    }, []);

    const loadConfigs = async () => {
        setLoading(true);
        try {
            // Load all configs in one request
            const allConfigs = await configService.getAllConfigs();

            // Set GitHub config
            if (allConfigs.github_config) {
                setGitConfig({
                    repo_url: allConfigs.github_config.repo_url,
                    branch: allConfigs.github_config.branch,
                    base_path: allConfigs.github_config.base_path,
                    file_template: allConfigs.github_config.file_template,
                    commit_template: allConfigs.github_config.commit_message_template,
                    token: allConfigs.github_config.token
                });
            } else {
                setGitConfig(null);
            }

            // Set LeetCode config
            if (allConfigs.leetcode_config) {
                setLeetCodeConfig({
                    sessionCookie: allConfigs.leetcode_config.session_cookie || '',
                    username: allConfigs.leetcode_config.username || ''
                });
            } else {
                setLeetCodeConfig(null);
            }

            // Set Notion config
            if (allConfigs.notion_config) {
                setNotionConfig({
                    token: allConfigs.notion_config.token || '',
                    db_id: allConfigs.notion_config.db_id || ''
                });
            } else {
                setNotionConfig(null);
            }

            // Set Gemini config
            if (allConfigs.gemini_config) {
                setGeminiConfig({
                    api_key: allConfigs.gemini_config.api_key || '',
                    model_name: allConfigs.gemini_config.model_name || ''
                });
            } else {
                setGeminiConfig(null);
            }

            // Set Notification config
            if (allConfigs.notification_config) {
                setNotificationConfig({ notification_config: allConfigs.notification_config });
            } else {
                setNotificationConfig(null);
            }
        } catch (error) {
            console.error('Error loading configs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGitConfigSave = async (values) => {
        try {
            // Convert data format to match backend expected format
            const configData = {
                repo_url: values.repo_url,
                branch: values.branch,
                base_path: values.base_path,
                file_template: values.file_template,
                commit_template: values.commit_template,
                token: values.token
            };
            await configService.updateGitConfig(configData);
            // Reload configs to ensure data consistency
            await loadConfigs();
        } catch (error) {
            console.error('Error saving Git config:', error);
        }
    };

    const handleLeetCodeConfigSave = async (values) => {
        try {
            // Convert data format to match backend expected format
            const configData = {
                session_cookie: values.sessionCookie,
                username: values.username || ''
            };
            await configService.updateLeetCodeConfig(configData);
            await refreshConfigs();
            // Reload configs to ensure data consistency
            await loadConfigs();
        } catch (error) {
            console.error('Error saving LeetCode config:', error);
        }
    };

    const items = [
        {
            key: 'integrations',
            label: t('settings.integrations'),
            children: (
                <Row gutter={[16, 16]}>
                    {/* LeetCode Integration */}
                    <Col xs={24} lg={12}>
                        <ConfigCard
                            title={t('settings.leetcodeIntegration')}
                            icon={<CodeOutlined style={{ fontSize: '18px', color: '#1890ff' }} />}
                            description={t('settings.leetcodeDescription')}
                            status={leetcodeConfig?.sessionCookie ? 'configured' : 'not_configured'}
                            onConfigure={() => setLeetCodeModalVisible(true)}
                            loading={loading}
                        />
                    </Col>

                    {/* GitHub Integration */}
                    <Col xs={24} lg={12}>
                        <ConfigCard
                            title={t('git.configTitle')}
                            icon={<GithubOutlined style={{ fontSize: '18px', color: '#1890ff' }} />}
                            description={t('settings.githubDescription')}
                            status={gitConfig ? 'configured' : 'not_configured'}
                            onConfigure={() => setGithubModalVisible(true)}
                            loading={loading}
                        />
                    </Col>

                    {/* Notion Integration */}
                    <Col xs={24} lg={12}>
                        <ConfigCard
                            title={t('settings.notionIntegration')}
                            icon={<BookOutlined style={{ fontSize: '18px', color: '#1890ff' }} />}
                            description={t('settings.notionDescription')}
                            status={notionConfig?.token ? 'configured' : 'not_configured'}
                            onConfigure={() => setNotionModalVisible(true)}
                            loading={loading}
                        />
                    </Col>

                    {/* Gemini Integration */}
                    <Col xs={24} lg={12}>
                        <ConfigCard
                            title={t('gemini.title')}
                            icon={<RobotOutlined style={{ fontSize: '18px', color: '#1890ff' }} />}
                            description={t('gemini.subtitle')}
                            status={geminiConfig?.api_key ? 'configured' : 'not_configured'}
                            onConfigure={() => setGeminiModalVisible(true)}
                            loading={loading}
                        />
                        <GeminiIntegrationModal
                            visible={geminiModalVisible}
                            onCancel={() => setGeminiModalVisible(false)}
                            onSuccess={async () => { setGeminiModalVisible(false); await loadConfigs(); }}
                            initialValues={geminiConfig}
                        />
                    </Col>
                    {/* Notification Config Integration */}
                    <Col xs={24} lg={12}>
                        <ConfigCard
                            title={t('settings.notificationSettings') || 'Notification Settings'}
                            icon={<WarningOutlined style={{ fontSize: '18px', color: '#faad14' }} />}
                            description={t('settings.notificationDescription') || 'Configure email, push, SMS and other notification methods'}
                            status={notificationConfig?.notification_config?.email?.enabled || notificationConfig?.notification_config?.push?.enabled || notificationConfig?.notification_config?.sms?.enabled ? 'configured' : 'not_configured'}
                            onConfigure={() => setNotificationModalVisible(true)}
                            loading={loading}
                        />
                        <NotificationConfigModal
                            visible={notificationModalVisible}
                            onCancel={() => setNotificationModalVisible(false)}
                            onSuccess={async () => { setNotificationModalVisible(false); await loadConfigs(); }}
                            initialValues={notificationConfig}
                        />
                    </Col>
                </Row>
            )
        },
        {
            key: 'account',
            label: t('settings.accountSettings'),
            children: (
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card size="small" style={{ height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                <UserOutlined style={{ fontSize: '18px', marginRight: '8px', color: '#1890ff' }} />
                                <Title level={5} style={{ margin: 0 }}>{t('settings.accountSettings')}</Title>
                            </div>

                            <Alert
                                message={t('settings.featureInDevelopment')}
                                description={t('settings.accountDescription')}
                                type="info"
                                showIcon
                                icon={<InfoCircleOutlined />}
                                style={{ fontSize: '12px' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )
        }
    ];

    return (
        <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
                <Title level={3} style={{ margin: 0 }}>
                    <SettingOutlined /> {t('settings.title')}
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                    {t('settings.description')}
                </Text>
            </div>

            <Tabs items={items} />

            {/* LeetCode Integration Modal */}
            <LeetCodeIntegrationModal
                visible={leetcodeModalVisible}
                onCancel={() => setLeetCodeModalVisible(false)}
                onSuccess={handleLeetCodeConfigSave}
                initialValues={leetcodeConfig}
            />

            {/* GitHub Integration Modal */}
            <GitHubIntegrationModal
                visible={githubModalVisible}
                onCancel={() => setGithubModalVisible(false)}
                onSuccess={handleGitConfigSave}
                initialValues={gitConfig}
            />

            {/* Notion Integration Modal */}
            <NotionIntegrationModal
                visible={notionModalVisible}
                onCancel={() => setNotionModalVisible(false)}
                onSuccess={async () => { setNotionModalVisible(false); await loadConfigs(); }}
                initialValues={notionConfig}
            />
        </div>
    );
};

export default Settings;
