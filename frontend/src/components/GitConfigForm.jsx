import React, { useState } from 'react';
import { Form, Input, Button, Select, message, Space } from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import gitSyncService from '../services/gitSyncService';

const { TextArea } = Input;

const GitConfigForm = ({ onSave, initialValues, onTestConnection }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await gitSyncService.updateGitConfig(values);
      message.success(t('git.configSaved'));
      onSave && onSave(values);
    } catch (error) {
      message.error(t('git.configError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    const values = form.getFieldsValue();
    if (!values.repoUrl || !values.token) {
      message.warning(t('git.configRequired'));
      return;
    }

    setTesting(true);
    try {
      const response = await gitSyncService.testGitConnection(values);
      if (response.status === 'success') {
        message.success(t('git.connectionSuccess'));
      } else {
        message.error(t('git.connectionFailed') + ': ' + response.message);
      }
    } catch (error) {
      message.error(t('git.connectionError') + ': ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={
        initialValues || {
          branch: 'main',
          base_path: 'solutions/leetcode/',
          commit_template: 'feat: solve {problem_title} - {date}',
        }
      }
    >
      <Form.Item
        name="repo_url"
        label={t('git.repoUrl')}
        rules={[{ required: true, message: t('git.repoUrlRequired') }]}
      >
        <Input
          placeholder="https://github.com/username/repo.git"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="branch"
        label={t('git.branch')}
        rules={[{ required: true, message: t('git.branchRequired') }]}
      >
        <Select size="large">
          <Select.Option value="main">main</Select.Option>
          <Select.Option value="master">master</Select.Option>
          <Select.Option value="develop">develop</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="base_path"
        label={t('git.filePath')}
        rules={[{ required: true, message: t('git.filePathRequired') }]}
      >
        <Input placeholder="solutions/leetcode/" size="large" />
      </Form.Item>

      <Form.Item
        name="commit_template"
        label={t('git.commitTemplate')}
        extra={t('git.commitTemplateHelp')}
      >
        <TextArea placeholder="feat: solve {problem_title} - {date}" rows={3} />
      </Form.Item>

      <Form.Item
        name="token"
        label={t('git.token')}
        rules={[{ required: true, message: t('git.tokenRequired') }]}
        extra={
          <div>
            <div>{t('git.tokenHelp')}</div>
            <div style={{ marginTop: '8px' }}>
              <strong>{t('git.howToGetToken')}</strong>
              <div
                style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}
              >
                <div>1. {t('git.tokenStep1')}</div>
                <div>2. {t('git.tokenStep2')}</div>
                <div>3. {t('git.tokenStep3')}</div>
                <div>4. {t('git.tokenStep4')}</div>
                <div>5. {t('git.tokenStep5')}</div>
              </div>
            </div>
          </div>
        }
      >
        <Input.Password size="large" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
          >
            {t('git.saveConfig')}
          </Button>
          <Button
            onClick={testConnection}
            loading={testing}
            icon={<CheckCircleOutlined />}
            size="large"
          >
            {t('git.testConnection')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default GitConfigForm;
