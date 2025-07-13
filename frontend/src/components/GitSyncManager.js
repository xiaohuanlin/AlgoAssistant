import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Modal, Form, Input, message, Space, Typography } from 'antd';
import { GithubOutlined, SyncOutlined, SettingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import gitSyncService from '../services/gitSyncService';

const { Title, Text } = Typography;

const GitSyncManager = () => {
  const { t } = useTranslation();
  const [configStatus, setConfigStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setLoading(true);
    try {
      const status = await gitSyncService.getConfigurationStatus();
      setConfigStatus(status);
    } catch (error) {
      console.error('Failed to check configuration:', error);
      setConfigStatus({
        configured: false,
        message: 'Failed to check configuration',
        action: 'configure',
        actionText: 'Configure Git Repository'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (recordIds = null) => {
    setSyncLoading(true);
    try {
      const result = await gitSyncService.syncToGit(recordIds);
      message.success(`Sync started: ${result.message}`);
    } catch (error) {
      if (error.message.includes('Git configuration not found')) {
        message.error(t('git.configNotFound'));
        setConfigModalVisible(true);
      } else {
        message.error(`Sync failed: ${error.message}`);
      }
    } finally {
      setSyncLoading(false);
    }
  };

  // Removed handleRetry function since we only support task-specific operations

  const handleSaveConfig = async (values) => {
    try {
      await gitSyncService.updateGitConfig(values);
      message.success('Git configuration saved successfully');
      setConfigModalVisible(false);
      form.resetFields();
      checkConfiguration();
    } catch (error) {
      message.error(t('git.configError') + ': ' + error.message);
    }
  };

  const handleTestConnection = async () => {
    try {
      const config = configStatus.config;
      const result = await gitSyncService.testGitConnection(config);
      if (result.status === 'success') {
        message.success(t('git.connectionSuccess'));
      } else {
        message.error(t('git.connectionFailed') + ': ' + result.message);
      }
    } catch (error) {
      message.error(t('git.connectionError') + ': ' + error.message);
    }
  };

  const renderConfigurationCard = () => {
    if (loading) {
      return (
        <Card>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <SyncOutlined spin style={{ fontSize: '24px' }} />
            <div style={{ marginTop: '10px' }}>{t('common.loading')}</div>
          </div>
        </Card>
      );
    }

    if (!configStatus) {
      return (
        <Card>
          <Alert
            message={t('common.error')}
            description={t('git.configError')}
            type="error"
            showIcon
          />
        </Card>
      );
    }

    return (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={4}>
              <GithubOutlined /> {t('git.configTitle')}
            </Title>
            <Text type={configStatus.configured ? 'success' : 'danger'}>
              {configStatus.message}
            </Text>
          </div>
          <Space>
            {configStatus.configured && (
              <Button
                icon={<CheckCircleOutlined />}
                onClick={handleTestConnection}
              >
                {t('git.testConnection')}
              </Button>
            )}
            <Button
              type={configStatus.configured ? 'default' : 'primary'}
              icon={<SettingOutlined />}
              onClick={() => setConfigModalVisible(true)}
            >
              {configStatus.actionText}
            </Button>
          </Space>
        </div>

        {configStatus.configured && configStatus.config && (
          <div style={{ marginTop: '16px' }}>
            <Text strong>{t('git.repoUrl')}:</Text> {configStatus.config.repo_url}<br />
            <Text strong>{t('git.branch')}:</Text> {configStatus.config.branch}<br />
            <Text strong>{t('git.filePath')}:</Text> {configStatus.config.base_path}
          </div>
        )}
      </Card>
    );
  };

  const renderSyncActions = () => {
    if (!configStatus?.configured) {
      return (
        <Card>
          <Alert
            message={t('git.configRequired')}
            description={t('git.configRequired')}
            type="warning"
            showIcon
            action={
              <Button size="small" type="primary" onClick={() => setConfigModalVisible(true)}>
                {t('git.configNotFoundAction')}
              </Button>
            }
          />
        </Card>
      );
    }

    return (
      <Card>
        <Title level={4}>{t('git.syncStatusTitle')}</Title>
        <Space>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            loading={syncLoading}
            onClick={() => handleSync()}
          >
            {t('git.syncStarted')}
          </Button>
        </Space>
      </Card>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>{t('git.title')}</Title>

      {renderConfigurationCard()}

      <div style={{ marginTop: '20px' }}>
        {renderSyncActions()}
      </div>

      {/* Configuration Modal */}
      <Modal
        title={t('git.configTitle')}
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveConfig}
          initialValues={configStatus?.config || {}}
        >
          <Form.Item
            label={t('git.repoUrl')}
            name="repo_url"
            rules={[
              { required: true, message: t('git.repoUrlRequired') },
              { type: 'url', message: t('git.repoUrlRequired') }
            ]}
          >
            <Input
              placeholder="https://github.com/username/repository.git"
              prefix={<GithubOutlined />}
            />
          </Form.Item>

          <Form.Item
            label={t('git.branch')}
            name="branch"
            rules={[{ required: true, message: t('git.branchRequired') }]}
          >
            <Input placeholder="main" />
          </Form.Item>

          <Form.Item
            label={t('git.filePath')}
            name="base_path"
            rules={[{ required: true, message: t('git.filePathRequired') }]}
          >
            <Input placeholder="solutions" />
          </Form.Item>

          <Form.Item
            label={t('git.token')}
            name="token"
            rules={[{ required: true, message: t('git.tokenRequired') }]}
            extra={
              <div>
                <div>{t('git.tokenHelp')}</div>
                <div style={{ marginTop: '8px' }}>
                  <strong>{t('git.howToGetToken')}</strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    <div>{t('git.tokenStep1')}</div>
                    <div>{t('git.tokenStep2')}</div>
                    <div>{t('git.tokenStep3')}</div>
                    <div>{t('git.tokenStep4')}</div>
                  </div>
                </div>
              </div>
            }
          >
            <Input.Password placeholder="GitHub Personal Access Token" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {t('git.saveConfig')}
              </Button>
              <Button onClick={() => setConfigModalVisible(false)}>
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GitSyncManager;
