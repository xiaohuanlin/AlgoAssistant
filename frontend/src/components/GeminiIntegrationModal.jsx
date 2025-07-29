import React, { useState, useEffect } from 'react';
import { Input, Select, message, Form } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import configService from '../services/configService';
import geminiSyncService from '../services/geminiSyncService';
import ConfigModal from './common/ConfigModal';

const MODEL_OPTIONS = [
  { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
  { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
  { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
  { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
];

const GeminiIntegrationModal = ({ visible, onCancel, onSuccess, initialValues }) => {
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
          api_key: '',
          model_name: MODEL_OPTIONS[0].value,
        });
      }
    }
  }, [visible, initialValues, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await configService.updateGeminiConfig(values);
      message.success(t('gemini.configSaved'));
      onSuccess && onSuccess(values);
      onCancel();
    } catch (error) {
      message.error(t('gemini.configError') + ': ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      const result = await geminiSyncService.testGeminiConnection(values);
      if (result.status === 'success') {
        message.success(t('gemini.connectionSuccess'));
        return { success: true };
      } else {
        message.error(t('gemini.connectionFailed') + ': ' + (result.message || 'Unknown error'));
        return { success: false };
      }
    } catch (error) {
      if (error.errorFields) {
        message.warning(t('gemini.configRequired'));
        return { success: false };
      }
      message.error(t('gemini.connectionError') + ': ' + error.message);
      throw error;
    }
  };

  const helpSections = [
    {
      title: t('gemini.howToGetApiKey'),
      steps: [
        t('gemini.apiKeyStep1'),
        t('gemini.apiKeyStep2'),
        t('gemini.apiKeyStep3'),
        t('gemini.apiKeyStep4'),
        t('gemini.apiKeyStep5'),
      ]
    }
  ];

  return (
    <ConfigModal
      visible={visible}
      onCancel={onCancel}
      title={t('gemini.configTitle')}
      icon={<RobotOutlined />}
      description={t('gemini.description')}
      width={700}
      onSave={handleSave}
      onTest={handleTestConnection}
      loading={loading}
      testLoading={testing}
      form={form}
      helpSections={helpSections}
      okText={t('gemini.saveConfig')}
    >
      <Form.Item
        name="api_key"
        label={t('gemini.apiKey')}
        rules={[{ required: true, message: t('gemini.apiKeyRequired') }]}
      >
        <Input.Password size="large" />
      </Form.Item>

      <Form.Item
        name="model_name"
        label={t('gemini.modelName')}
        rules={[{ required: true, message: t('gemini.modelNameRequired') }]}
      >
        <Select options={MODEL_OPTIONS} size="large" />
      </Form.Item>
    </ConfigModal>
  );
};

export default GeminiIntegrationModal;
