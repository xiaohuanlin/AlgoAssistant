import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import configService from '../services/configService';
import notionService from '../services/notionService';

const NotionIntegrationModal = ({ visible, onCancel, onSuccess, initialValues }) => {
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
          token: '',
          db_id: ''
        });
      }
    }
  }, [visible, initialValues, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Convert to backend format
      const configData = {
        token: values.token,
        db_id: values.db_id,
      };

      await configService.updateNotionConfig(configData);
      message.success(t('notion.configSaved'));
      onSuccess && onSuccess(values);
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        // Form validation error, handled by antd
        return;
      }
      message.error(t('notion.configError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      const result = await notionService.testConnection();
      if (result.connected) {
        message.success(t('notion.connectionSuccess'));
      } else {
        message.error(t('notion.connectionFailed') + ': ' + result.message);
      }
    } catch (error) {
      if (error.errorFields) {
        message.warning(t('notion.configRequired'));
        return;
      }
      message.error(t('notion.connectionError') + ': ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal
      title={t('notion.configTitle')}
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
            {t('notion.testConnection')}
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
              {t('notion.saveConfig')}
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
          name="token"
          label={t('notion.apiKey')}
          rules={[
            { required: true, message: t('notion.apiKeyRequired') },
            { min: 10, message: t('notion.apiKeyInvalid') }
          ]}
          extra={
            <div>
              <div style={{ marginTop: '8px' }}>
                <strong>{t('notion.howToGetApiKey')}</strong>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  <div>1. {t('notion.apiKeyStep1')}</div>
                  <div>2. {t('notion.apiKeyStep2')}</div>
                  <div>3. {t('notion.apiKeyStep3')}</div>
                  <div>4. {t('notion.apiKeyStep4')}</div>
                  <div>5. {t('notion.apiKeyStep5')}</div>
                </div>
              </div>
            </div>
          }
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
            { pattern: /^[a-f0-9]{32}$/, message: t('notion.databaseIdInvalid') }
          ]}
          extra={
            <div>
              <div style={{ marginTop: '8px' }}>
                <strong>{t('notion.howToGetDatabaseId')}</strong>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  <div>1. {t('notion.databaseIdStep1')}</div>
                  <div>2. {t('notion.databaseIdStep2')}</div>
                  <div>3. {t('notion.databaseIdStep3')}</div>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <strong>{t('notion.howToGrantDatabaseAccess')}</strong>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  <div>1. {t('notion.databaseAccessStep1')}</div>
                  <div>2. {t('notion.databaseAccessStep2')}</div>
                  <div>3. {t('notion.databaseAccessStep3')}</div>
                  <div>4. {t('notion.databaseAccessStep4')}</div>
                  <div>5. {t('notion.databaseAccessStep5')}</div>
                  <div>6. {t('notion.databaseAccessStep6')}</div>
                  <div>7. {t('notion.databaseAccessStep7')}</div>
                </div>
                <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
                  {t('notion.databaseAccessNote')}
                </div>
              </div>
            </div>
          }
        >
          <Input
            placeholder={t('notion.databaseIdPlaceholder')}
            size="large"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NotionIntegrationModal;
