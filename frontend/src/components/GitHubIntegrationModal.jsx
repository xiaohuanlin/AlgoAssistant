import React, { useState, useEffect } from 'react';
import { Form, Input, Select, message, Table, Typography, Divider } from 'antd';
import { GithubOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import configService from '../services/configService';
import gitSyncService from '../services/gitSyncService';
import ConfigModal from './common/ConfigModal';

const { TextArea } = Input;
const { Title, Text } = Typography;

const GitHubIntegrationModal = ({ visible, onCancel, onSuccess, initialValues }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const permissionsData = [
    {
      key: '1',
      type: t('git.repositoryPermissions'),
      item: t('git.contents'),
      setting: t('git.readAndWrite'),
      usage: t('git.contentsUsage')
    },
    {
      key: '2',
      type: t('git.repositoryPermissions'),
      item: t('git.metadata'),
      setting: t('git.readOnly'),
      usage: t('git.metadataUsage')
    },
    {
      key: '3',
      type: t('git.repositoryPermissions'),
      item: t('git.commitStatuses'),
      setting: t('git.readOnly'),
      usage: t('git.commitStatusesUsage')
    }
  ];

  const permissionsColumns = [
    {
      title: t('git.permissionType'),
      dataIndex: 'type',
      key: 'type',
      width: 150
    },
    {
      title: t('git.permissionItem'),
      dataIndex: 'item',
      key: 'item',
      width: 120
    },
    {
      title: t('git.permissionSetting'),
      dataIndex: 'setting',
      key: 'setting',
      width: 120,
      render: (text) => <Text strong style={{ color: '#52c41a' }}>{text}</Text>
    },
    {
      title: t('git.permissionUsage'),
      dataIndex: 'usage',
      key: 'usage',
      ellipsis: true
    }
  ];

  useEffect(() => {
    if (visible) {
      const defaultValues = {
        branch: 'main',
        base_path: 'solutions/leetcode/',
        file_template: 'solution_{problem_title}_{date}_{time}.{ext}',
        commit_template: 'feat: solve {problem_title} - {date}'
      };

      if (initialValues) {
        form.setFieldsValue({ ...defaultValues, ...initialValues });
      } else {
        form.setFieldsValue(defaultValues);
      }
    }
  }, [visible, initialValues, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await configService.updateGitConfig(values);
      message.success(t('git.configSaved'));
      onSuccess && onSuccess(values);
      onCancel();
    } catch (error) {
      message.error(t('git.configError') + ': ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const values = await form.validateFields();
      if (!values.repo_url || !values.token) {
        message.warning(t('git.configRequired'));
        return { success: false };
      }

      const response = await gitSyncService.testGitConnection(values);
      if (response.connected) {
        message.success(t('git.connectionSuccess'));
        return { success: true };
      } else {
        message.error(t('git.connectionFailed') + ': ' + (response.message || ''));
        return { success: false };
      }
    } catch (error) {
      if (error.errorFields) {
        message.warning(t('git.configRequired'));
        return { success: false };
      }
      message.error(t('git.connectionError') + ': ' + error.message);
      throw error;
    } finally {
      setTesting(false);
    }
  };

  const helpSections = [
    {
      title: t('git.howToGetToken'),
      steps: [
        t('git.tokenStep1'),
        t('git.tokenStep2'),
        t('git.tokenStep3'),
        t('git.tokenStep4'),
        t('git.tokenStep5'),
      ]
    }
  ];

  const renderPermissionsSection = () => (
    <>
      <Divider />
      <div style={{ marginBottom: '16px' }}>
        <Title level={5} style={{ marginBottom: '8px' }}>
          <InfoCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          {t('git.permissionsTitle')}
        </Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          {t('git.permissionsDescription')}
        </Text>
      </div>
      <Table
        dataSource={permissionsData}
        columns={permissionsColumns}
        pagination={false}
        size="small"
        style={{ marginBottom: '16px' }}
        scroll={{ x: 600 }}
      />
    </>
  );

  return (
    <ConfigModal
      visible={visible}
      onCancel={onCancel}
      title={t('git.title')}
      icon={<GithubOutlined />}
      description={t('settings.githubDescription')}
      width={800}
      onSave={handleSave}
      onTest={handleTestConnection}
      loading={loading}
      testLoading={testing}
      form={form}
      helpSections={helpSections}
      okText={t('git.saveConfig')}
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
        <Input
          placeholder="solutions/leetcode/"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="file_template"
        label={t('git.fileTemplate')}
        rules={[{ required: true, message: t('git.fileTemplateRequired') }]}
        extra={t('git.fileTemplateHelp')}
      >
        <Input
          placeholder="solution_{problem_title}_{date}_{time}.{ext}"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="commit_template"
        label={t('git.commitTemplate')}
        extra={t('git.commitTemplateHelp')}
      >
        <TextArea
          placeholder="feat: solve {problem_title} - {date}"
          rows={3}
        />
      </Form.Item>

      <Form.Item
        name="token"
        label={t('git.token')}
        rules={[{ required: true, message: t('git.tokenRequired') }]}
        extra={t('git.tokenHelp')}
      >
        <Input.Password size="large" />
      </Form.Item>

      {renderPermissionsSection()}
    </ConfigModal>
  );
};

export default GitHubIntegrationModal;
