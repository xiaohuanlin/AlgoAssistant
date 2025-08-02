import React, { useState, useEffect } from 'react';
import { Form, Input, message } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import configService from '../services/configService';
import notionService from '../services/notionService';
import ConfigModal from './common/ConfigModal';

const NotionIntegrationModal = ({
  visible,
  onCancel,
  onSuccess,
  initialValues,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.setFieldsValue({
          token: '',
          db_id: '',
        });
      }
    }
  }, [visible, initialValues, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const configData = {
        token: values.token,
        db_id: values.db_id,
      };
      await configService.updateNotionConfig(configData);
      message.success(t('notion.configSaved'));
      onSuccess && onSuccess(values);
      onCancel();
    } catch (error) {
      message.error(t('notion.configError') + ': ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      await form.validateFields();
      const result = await notionService.testConnection();
      if (result.connected) {
        message.success(t('notion.connectionSuccess'));
        return { success: true };
      } else {
        message.error(t('notion.connectionFailed') + ': ' + result.message);
        return { success: false };
      }
    } catch (error) {
      if (error.errorFields) {
        message.warning(t('notion.configRequired'));
        return { success: false };
      }
      message.error(t('notion.connectionError') + ': ' + error.message);
      throw error;
    }
  };

  const helpSections = [
    {
      title: t('notion.howToGetApiKey'),
      steps: [
        t('notion.apiKeyStep1'),
        t('notion.apiKeyStep2'),
        t('notion.apiKeyStep3'),
        t('notion.apiKeyStep4'),
        t('notion.apiKeyStep5'),
      ],
    },
    {
      title: t('notion.howToGetDatabaseId'),
      steps: [
        t('notion.databaseIdStep1'),
        t('notion.databaseIdStep2'),
        t('notion.databaseIdStep3'),
      ],
    },
    {
      title: t('notion.howToGrantDatabaseAccess'),
      steps: [
        t('notion.databaseAccessStep1'),
        t('notion.databaseAccessStep2'),
        t('notion.databaseAccessStep3'),
        t('notion.databaseAccessStep4'),
        t('notion.databaseAccessStep5'),
        t('notion.databaseAccessStep6'),
        t('notion.databaseAccessStep7'),
      ],
      content: t('notion.databaseAccessNote'),
    },
  ];

  return (
    <ConfigModal
      visible={visible}
      onCancel={onCancel}
      title={t('notion.title')}
      icon={<BookOutlined />}
      description={t('notion.description')}
      width={700}
      onSave={handleSave}
      onTest={handleTestConnection}
      loading={loading}
      testLoading={testing}
      form={form}
      helpSections={helpSections}
      okText={t('notion.saveConfig')}
    >
      <Form.Item
        name="token"
        label={t('notion.apiKey')}
        rules={[
          { required: true, message: t('notion.apiKeyRequired') },
          { min: 10, message: t('notion.apiKeyInvalid') },
        ]}
      >
        <Input.Password
          placeholder={t('notion.apiKeyPlaceholder')}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="db_id"
        label={t('notion.databaseId')}
        rules={[
          { required: true, message: t('notion.databaseIdRequired') },
          { pattern: /^[a-f0-9]{32}$/, message: t('notion.databaseIdInvalid') },
        ]}
      >
        <Input placeholder={t('notion.databaseIdPlaceholder')} size="large" />
      </Form.Item>
    </ConfigModal>
  );
};

export default NotionIntegrationModal;
