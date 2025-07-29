import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Tabs, Tag, Button } from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  BookOutlined,
  RobotOutlined,
  BellOutlined,
  CodeOutlined,
  GithubOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { ConfigCard } from '../components/common';
import LeetCodeIntegrationModal from '../components/LeetCodeIntegrationModal';
import {
  GradientPageHeader,
  ModernCard,
  GRADIENT_THEMES
} from '../components/ui/ModernDesignSystem';
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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
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


    const getConfigStatus = (isConfigured) => ({
        color: isConfigured ? 'success' : 'warning',
        text: isConfigured ? t('common.configured', 'Configured') : t('common.notConfigured', 'Not Configured')
    });

    const items = [
        {
            key: 'integrations',
            label: t('settings.integrations', 'Integrations'),
            children: (
                <Row gutter={[16, 16]}>
                    {/* LeetCode Integration */}
                    <Col xs={24} lg={12}>
                        <ModernCard
                            title={t('settings.leetcodeIntegration', 'LeetCode Integration')}
                            icon={<CodeOutlined />}
                            iconGradient={GRADIENT_THEMES.info}
                            isMobile={isMobile}
                            extra={
                                <Button
                                    type={leetcodeConfig?.sessionCookie ? 'default' : 'primary'}
                                    size="small"
                                    onClick={() => setLeetCodeModalVisible(true)}
                                    loading={loading}
                                >
                                    {leetcodeConfig?.sessionCookie ? t('common.update', 'Update') : t('common.configure', 'Configure')}
                                </Button>
                            }
                        >
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ marginBottom: 8, color: '#666' }}>
                                    {t('settings.leetcodeDescription', 'Connect your LeetCode account to sync submissions')}
                                </div>
                                <Tag color={getConfigStatus(leetcodeConfig?.sessionCookie).color}>
                                    {getConfigStatus(leetcodeConfig?.sessionCookie).text}
                                </Tag>
                            </div>
                        </ModernCard>
                    </Col>

                    {/* GitHub Integration */}
                    <Col xs={24} lg={12}>
                        <ModernCard
                            title={t('git.configTitle', 'GitHub Integration')}
                            icon={<GithubOutlined />}
                            iconGradient={GRADIENT_THEMES.slate}
                            isMobile={isMobile}
                            extra={
                                <Button
                                    type={gitConfig ? 'default' : 'primary'}
                                    size="small"
                                    onClick={() => setGithubModalVisible(true)}
                                    loading={loading}
                                >
                                    {gitConfig ? t('common.update', 'Update') : t('common.configure', 'Configure')}
                                </Button>
                            }
                        >
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ marginBottom: 8, color: '#666' }}>
                                    {t('settings.githubDescription', 'Connect your GitHub account to sync code')}
                                </div>
                                <Tag color={getConfigStatus(gitConfig).color}>
                                    {getConfigStatus(gitConfig).text}
                                </Tag>
                            </div>
                        </ModernCard>
                    </Col>

                    {/* Notion Integration */}
                    <Col xs={24} lg={12}>
                        <ModernCard
                            title={t('settings.notionIntegration', 'Notion Integration')}
                            icon={<BookOutlined />}
                            iconGradient={GRADIENT_THEMES.warning}
                            isMobile={isMobile}
                            extra={
                                <Button
                                    type={notionConfig?.token ? 'default' : 'primary'}
                                    size="small"
                                    onClick={() => setNotionModalVisible(true)}
                                    loading={loading}
                                >
                                    {notionConfig?.token ? t('common.update', 'Update') : t('common.configure', 'Configure')}
                                </Button>
                            }
                        >
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ marginBottom: 8, color: '#666' }}>
                                    {t('settings.notionDescription', 'Connect your Notion workspace to sync notes')}
                                </div>
                                <Tag color={getConfigStatus(notionConfig?.token).color}>
                                    {getConfigStatus(notionConfig?.token).text}
                                </Tag>
                            </div>
                        </ModernCard>
                    </Col>

                    {/* Gemini Integration */}
                    <Col xs={24} lg={12}>
                        <ModernCard
                            title={t('gemini.title', 'Gemini AI Integration')}
                            icon={<RobotOutlined />}
                            iconGradient={GRADIENT_THEMES.success}
                            isMobile={isMobile}
                            extra={
                                <Button
                                    type={geminiConfig?.api_key ? 'default' : 'primary'}
                                    size="small"
                                    onClick={() => setGeminiModalVisible(true)}
                                    loading={loading}
                                >
                                    {geminiConfig?.api_key ? t('common.update', 'Update') : t('common.configure', 'Configure')}
                                </Button>
                            }
                        >
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ marginBottom: 8, color: '#666' }}>
                                    {t('gemini.subtitle', 'Connect Gemini AI for intelligent code analysis')}
                                </div>
                                <Tag color={getConfigStatus(geminiConfig?.api_key).color}>
                                    {getConfigStatus(geminiConfig?.api_key).text}
                                </Tag>
                            </div>
                        </ModernCard>
                        <GeminiIntegrationModal
                            visible={geminiModalVisible}
                            onCancel={() => setGeminiModalVisible(false)}
                            onSuccess={async () => { setGeminiModalVisible(false); await loadConfigs(); }}
                            initialValues={geminiConfig}
                        />
                    </Col>

                    {/* Notification Config Integration */}
                    <Col xs={24} lg={12}>
                        <ModernCard
                            title={t('settings.notificationSettings', 'Notification Settings')}
                            icon={<BellOutlined />}
                            iconGradient={GRADIENT_THEMES.cyan}
                            isMobile={isMobile}
                            extra={
                                <Button
                                    type={notificationConfig?.notification_config ? 'default' : 'primary'}
                                    size="small"
                                    onClick={() => setNotificationModalVisible(true)}
                                    loading={loading}
                                >
                                    {notificationConfig?.notification_config ? t('common.update', 'Update') : t('common.configure', 'Configure')}
                                </Button>
                            }
                        >
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ marginBottom: 8, color: '#666' }}>
                                    {t('settings.notificationDescription', 'Configure email, push, SMS and other notification methods')}
                                </div>
                                <Tag color={getConfigStatus(notificationConfig?.notification_config?.email?.enabled || notificationConfig?.notification_config?.push?.enabled || notificationConfig?.notification_config?.sms?.enabled).color}>
                                    {getConfigStatus(notificationConfig?.notification_config?.email?.enabled || notificationConfig?.notification_config?.push?.enabled || notificationConfig?.notification_config?.sms?.enabled).text}
                                </Tag>
                            </div>
                        </ModernCard>
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
            label: t('settings.accountSettings', 'Account Settings'),
            children: (
                <Row gutter={[16, 16]}>
                    {/* 基本信息管理 */}
                    <Col xs={24} lg={12}>
                        <ModernCard
                            title={t('accountSettings.basicInfo', 'Basic Information')}
                            icon={<UserOutlined />}
                            iconGradient={GRADIENT_THEMES.primary}
                            isMobile={isMobile}
                            extra={
                                <Button
                                    type="default"
                                    size="small"
                                    onClick={() => setAccountModalVisible(true)}
                                    loading={loading}
                                >
                                    {t('common.manage', 'Manage')}
                                </Button>
                            }
                        >
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ marginBottom: 8, color: '#666' }}>
                                    {t('accountSettings.basicInfoDesc', 'Manage your username, email, nickname and avatar')}
                                </div>
                                <Tag color="success">
                                    {t('common.configured', 'Configured')}
                                </Tag>
                            </div>
                        </ModernCard>
                    </Col>

                    {/* 密码管理 */}
                    <Col xs={24} lg={12}>
                        <ModernCard
                            title={t('accountSettings.security', 'Security Settings')}
                            icon={<SettingOutlined />}
                            iconGradient={GRADIENT_THEMES.danger}
                            isMobile={isMobile}
                            extra={
                                <Button
                                    type="default"
                                    size="small"
                                    onClick={() => setPasswordModalVisible(true)}
                                    loading={loading}
                                >
                                    {t('common.manage', 'Manage')}
                                </Button>
                            }
                        >
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ marginBottom: 8, color: '#666' }}>
                                    {t('accountSettings.securityDesc', 'Change password and manage account security')}
                                </div>
                                <Tag color="success">
                                    {t('common.configured', 'Configured')}
                                </Tag>
                            </div>
                        </ModernCard>
                    </Col>
                </Row>
            )
        }
    ];

    return (
        <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: isMobile ? '16px' : '24px'
        }}>
            {/* Modern Page Header */}
            <GradientPageHeader
                icon={<SettingOutlined style={{
                    fontSize: isMobile ? '24px' : '36px',
                    color: 'white'
                }} />}
                title={t('settings.title', 'Settings')}
                subtitle={(
                    <>
                        <BarChartOutlined style={{ fontSize: isMobile ? '16px' : '20px' }} />
                        {t('settings.description', 'Configure your integrations and preferences')}
                    </>
                )}
                isMobile={isMobile}
                gradient={GRADIENT_THEMES.purple}
            />

            <ModernCard
                title={t('settings.configurationTabs', 'Configuration')}
                icon={<SettingOutlined />}
                iconGradient={GRADIENT_THEMES.slate}
                isMobile={isMobile}
            >
                <Tabs items={items} />
            </ModernCard>

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
