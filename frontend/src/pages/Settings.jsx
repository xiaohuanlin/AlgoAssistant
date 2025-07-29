import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Tabs } from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  BookOutlined,
  RobotOutlined,
  BellOutlined,
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
import AccountSettingsModal from '../components/AccountSettingsModal';
import PasswordChangeModal from '../components/PasswordChangeModal';

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
    const [accountModalVisible, setAccountModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [allConfigs, setAllConfigs] = useState({});

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
            setAllConfigs(allConfigs);

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
                            icon={<BellOutlined style={{ fontSize: '18px', color: '#1890ff' }} />}
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
                    {/* 基本信息管理 */}
                    <Col xs={24} lg={12}>
                        <ConfigCard
                            title={t('accountSettings.basicInfo') || 'Basic Information'}
                            icon={<UserOutlined style={{ fontSize: '18px', color: '#1890ff' }} />}
                            description={t('accountSettings.basicInfoDesc') || 'Manage your username, email, nickname and avatar'}
                            status="configured"
                            onConfigure={() => setAccountModalVisible(true)}
                            loading={loading}
                        />
                    </Col>

                    {/* 密码管理 */}
                    <Col xs={24} lg={12}>
                        <ConfigCard
                            title={t('accountSettings.security') || 'Security Settings'}
                            icon={<SettingOutlined style={{ fontSize: '18px', color: '#1890ff' }} />}
                            description={t('accountSettings.securityDesc') || 'Change password and manage account security'}
                            status="configured"
                            onConfigure={() => setPasswordModalVisible(true)}
                            loading={loading}
                        />
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

            {/* Account Settings Modal */}
            <AccountSettingsModal
                visible={accountModalVisible}
                onCancel={() => setAccountModalVisible(false)}
                onSuccess={async () => { setAccountModalVisible(false); await loadConfigs(); }}
            />

            {/* Password Change Modal */}
            <PasswordChangeModal
                visible={passwordModalVisible}
                onCancel={() => setPasswordModalVisible(false)}
                onSuccess={async () => { setPasswordModalVisible(false); }}
            />
        </div>
    );
};

export default Settings;
