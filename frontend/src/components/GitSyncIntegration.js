import React, { useState } from 'react';
import { Button, message, Modal, Form, Input, Space } from 'antd';
import { GithubOutlined, SyncOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import gitSyncService from '../services/gitSyncService';

const GitSyncIntegration = ({ recordIds, onSyncComplete }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await gitSyncService.syncToGit(recordIds);
      message.success(t('git.syncStarted') + ': ' + result.message);
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      if (error.message.includes('Git configuration not found')) {
        // Show configuration modal instead of error message
        setConfigModalVisible(true);
      } else {
        message.error(t('git.syncError') + ': ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (values) => {
    try {
      await gitSyncService.updateGitConfig(values);
      message.success(t('git.configSaved'));
      setConfigModalVisible(false);
      form.resetFields();

      // Retry the sync operation after configuration
      setTimeout(() => {
        handleSync();
      }, 1000);
    } catch (error) {
      message.error(t('git.configError') + ': ' + error.message);
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<SyncOutlined />}
        loading={loading}
        onClick={handleSync}
      >
        {t('git.title')}
      </Button>

      <Modal
        title={t('git.configTitle')}
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: '16px' }}>
          <p>{t('git.configRequired')}</p>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
          <Form.Item
            label={t('git.repoUrl')}
            name="repo_url"
            rules={[
              { required: true, message: t('git.repoUrlRequired') },
              { type: 'url', message: t('git.repoUrlRequired') },
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
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '4px',
                    }}
                  >
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
                {t('git.saveConfig')} & {t('git.title')}
              </Button>
              <Button onClick={() => setConfigModalVisible(false)}>
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default GitSyncIntegration;
