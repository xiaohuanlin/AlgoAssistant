import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Select, message, Form } from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import configService from '../services/configService';
import geminiSyncService from '../services/geminiSyncService';

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
  const [testing, setTesting] = useState(false);

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

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await configService.updateGeminiConfig(values);
      message.success(t('gemini.configSaved'));
      onSuccess && onSuccess(values);
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        // Form validation error, handled by antd
        return;
      }
      message.error(t('gemini.configError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      const result = await geminiSyncService.testGeminiConnection(values);
      if (result.status === 'success') {
        message.success(t('gemini.connectionSuccess'));
      } else {
        message.error(t('gemini.connectionFailed') + ': ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      if (error.errorFields) {
        message.warning(t('gemini.configRequired'));
        return;
      }
      message.error(t('gemini.connectionError') + ': ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal
      title={t('gemini.configTitle')}
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <div key="footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            icon={<CheckCircleOutlined />}
            loading={testing}
            onClick={handleTestConnection}
          >
            {t('gemini.testConnection')}
          </Button>
          <div>
            <Button onClick={onCancel} style={{ marginRight: '8px' }}>
              {t('common.cancel')}
            </Button>
            <Button
              type="primary"
              loading={loading}
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
            >
              {t('gemini.saveConfig')}
            </Button>
          </div>
        </div>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        style={{ padding: '20px 0' }}
      >
        <Form.Item
          name="api_key"
          label={t('gemini.apiKey')}
          rules={[{ required: true, message: t('gemini.apiKeyRequired') }]}
          extra={
            <div>
              <div style={{ marginTop: '8px' }}>
                <strong>{t('gemini.howToGetApiKey')}</strong>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  <div>1. {t('gemini.apiKeyStep1')}</div>
                  <div>2. {t('gemini.apiKeyStep2')}</div>
                  <div>3. {t('gemini.apiKeyStep3')}</div>
                  <div>4. {t('gemini.apiKeyStep4')}</div>
                  <div>5. {t('gemini.apiKeyStep5')}</div>
                </div>
              </div>
            </div>
          }
        >
          <Input.Password
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="model_name"
          label={t('gemini.modelName')}
          rules={[{ required: true, message: t('gemini.modelNameRequired') }]}
        >
          <Select
            options={MODEL_OPTIONS}
            size="large"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GeminiIntegrationModal;
