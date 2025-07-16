import React, { useEffect, useState } from 'react';
import { Card, Typography, Form, Input, Button, Alert, message, Spin } from 'antd';
import { RobotOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import configService from '../services/configService';

const { Title, Text } = Typography;

const GeminiIntegration = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGeminiConfig();
  }, []);

  const loadGeminiConfig = async () => {
    setLoading(true);
    try {
      const config = await configService.getGeminiConfig();
      if (config && config.api_key) {
        setStatus('configured');
        form.setFieldsValue({ api_key: config.api_key });
      } else {
        setStatus('not_configured');
      }
    } catch (error) {
      setStatus('not_configured');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      await configService.updateGeminiConfig(values);
      message.success(t('settings.geminiIntegration') + ' ' + t('common.saved'));
      setStatus('configured');
    } catch (error) {
      message.error(t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <RobotOutlined style={{ fontSize: 32, color: '#1890ff', marginRight: 12 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>{t('settings.geminiIntegration')}</Title>
            <Text type="secondary">{t('settings.geminiDescription')}</Text>
          </div>
        </div>
        {loading ? (
          <Spin />
        ) : (
          <>
            {status === 'configured' ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message={t('settings.geminiIntegration') + ' ' + t('common.configured')}
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Alert
                type="warning"
                showIcon
                message={t('settings.geminiIntegration') + ' ' + t('common.notConfigured')}
                style={{ marginBottom: 16 }}
              />
            )}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              autoComplete="off"
            >
              <Form.Item
                label="Gemini API Key"
                name="api_key"
                rules={[{ required: true, message: 'Please input your Gemini API Key!' }]}
              >
                <Input.Password placeholder="sk-..." autoComplete="new-password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={saving} block>
                  {t('common.save')}
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
};

export default GeminiIntegration;
