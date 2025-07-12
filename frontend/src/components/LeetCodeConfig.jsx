import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Alert, Typography, message, Space } from 'antd';
import { CodeOutlined, InfoCircleOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import leetcodeService from '../services/leetcodeService';

const { Title } = Typography;

const LeetCodeConfig = () => {
    const { t } = useTranslation();
    const [config, setConfig] = useState({
        leetcode_token: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState(null);
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [form] = Form.useForm();

    const loadConfig = useCallback(async () => {
        try {
            const response = await leetcodeService.getConfig();
            const configData = {
                leetcode_token: response?.leetcode_token || ''
            };
            setConfig(configData);
            form.setFieldsValue(configData);
        } catch (error) {
            console.error('Error loading config:', error);
            // Config doesn't exist yet, that's fine
            const emptyConfig = {
                leetcode_token: ''
            };
            setConfig(emptyConfig);
            form.setFieldsValue(emptyConfig);
        } finally {
            setLoading(false);
        }
    }, [form]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const saveConfig = async (values) => {
        setSaving(true);
        
        try {
            await leetcodeService.updateConfig(values);
            setConfig(values);
            message.success(t('settings.configSaved'));
            setShowTokenInput(false); // Hide token input after saving
        } catch (error) {
            console.error('Error saving config:', error);
            message.error(t('settings.saveError') + ': ' + (error.response?.data?.detail || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleSync = async () => {
        if (!config.leetcode_token) {
            message.error(t('settings.tokenRequired'));
            return;
        }

        setSyncing(true);
        setSyncStatus(null);
        
        try {
            const result = await leetcodeService.startSync();
            setSyncStatus({
                success: true,
                message: t('settings.syncStarted'),
                data: result
            });
            message.success(t('settings.syncStarted'));
        } catch (error) {
            console.error('Error starting sync:', error);
            setSyncStatus({
                success: false,
                message: error.response?.data?.detail || error.message
            });
            message.error(t('settings.syncError') + ': ' + (error.response?.data?.detail || error.message));
        } finally {
            setSyncing(false);
        }
    };

    const handleStartSync = () => {
        if (config.leetcode_token) {
            // If token already exists, start sync directly
            handleSync();
        } else {
            // If no token, show token input
            setShowTokenInput(true);
        }
    };

    if (loading) {
        return (
            <Card size="small">
                <div style={{ textAlign: 'center', padding: '16px' }}>
                    <div>{t('common.loading')}</div>
                </div>
            </Card>
        );
    }

    return (
        <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <CodeOutlined style={{ fontSize: '18px', marginRight: '8px', color: '#ff6b35' }} />
                <Title level={5} style={{ margin: 0 }}>{t('settings.leetcodeIntegration')}</Title>
            </div>

            {!showTokenInput ? (
                <div>
                    <Alert
                        message={t('settings.howToGetToken')}
                        description={
                            <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '12px' }}>
                                <li>{t('settings.tokenStep1')}</li>
                                <li>{t('settings.tokenStep2')}</li>
                                <li>{t('settings.tokenStep3')}</li>
                                <li>{t('settings.tokenStep4')}</li>
                                <li>{t('settings.tokenStep5')}</li>
                            </ol>
                        }
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        style={{ marginBottom: '12px', fontSize: '12px' }}
                    />

                    <Button
                        type="primary"
                        icon={<SyncOutlined />}
                        onClick={handleStartSync}
                        style={{ width: '100%' }}
                    >
                        {t('settings.startSync')}
                    </Button>
                </div>
            ) : (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={saveConfig}
                    initialValues={config}
                    size="small"
                >
                    <Form.Item
                        name="leetcode_token"
                        label={t('settings.leetcodeToken')}
                        rules={[
                            { required: true, message: t('settings.tokenRequired') }
                        ]}
                    >
                        <Input.Password
                            placeholder={t('settings.tokenPlaceholder')}
                            prefix={<CodeOutlined />}
                        />
                    </Form.Item>

                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item style={{ marginBottom: '8px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={saving}
                                style={{ width: '100%' }}
                            >
                                {saving ? t('common.saving') : t('settings.saveConfig')}
                            </Button>
                        </Form.Item>

                        <Form.Item style={{ marginBottom: '8px' }}>
                            <Button
                                type="default"
                                icon={<SyncOutlined spin={syncing} />}
                                onClick={handleSync}
                                loading={syncing}
                                disabled={!config.leetcode_token}
                                style={{ width: '100%' }}
                            >
                                {syncing ? t('settings.syncing') : t('settings.startSync')}
                            </Button>
                        </Form.Item>

                        <Form.Item style={{ marginBottom: '0' }}>
                            <Button
                                type="text"
                                onClick={() => setShowTokenInput(false)}
                                style={{ width: '100%' }}
                            >
                                {t('common.cancel')}
                            </Button>
                        </Form.Item>
                    </Space>
                </Form>
            )}

            {syncStatus && (
                <Alert
                    message={
                        <Space>
                            {syncStatus.success ? (
                                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            ) : (
                                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                            )}
                            <span>{syncStatus.success ? t('settings.syncSuccess') : t('settings.syncFailed')}</span>
                        </Space>
                    }
                    description={syncStatus.message}
                    type={syncStatus.success ? 'success' : 'error'}
                    showIcon={false}
                    style={{ marginTop: '12px', fontSize: '12px' }}
                />
            )}
        </Card>
    );
};

export default LeetCodeConfig; 