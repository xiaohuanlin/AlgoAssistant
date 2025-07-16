import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Steps } from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import leetcodeService from '../services/leetcodeService';

const LeetCodeIntegrationModal = ({ visible, onCancel, onSuccess, initialValues }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [currentStep] = useState(0);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.setFieldsValue({});
      }
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Convert data structure to match backend expected format
      const configData = {
        session_cookie: values.sessionCookie,
        username: values.username || ''
      };
      await leetcodeService.updateLeetCodeConfig(configData);
      message.success(t('leetcode.configSaved'));
      onSuccess && onSuccess(values);
      onCancel();
    } catch (error) {
      message.error(t('leetcode.configError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    const values = form.getFieldsValue();
    if (!values.sessionCookie) {
      message.warning(t('leetcode.configRequired'));
      return;
    }

    setTesting(true);
    try {
      const response = await leetcodeService.testLeetCodeConnection();
      if (response.status === 'success') {
        message.success(t('leetcode.connectionSuccess'));
      } else {
        message.error(t('leetcode.connectionFailed') + ': ' + response.message);
      }
    } catch (error) {
      message.error(t('leetcode.connectionError') + ': ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const steps = [
    {
      title: t('leetcode.configTitle'),
      content: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="sessionCookie"
            label={t('leetcode.sessionCookie')}
            rules={[{ required: true, message: t('leetcode.sessionCookieRequired') }]}
            extra={
              <div>
                <div style={{ marginTop: '8px' }}>
                  <strong>{t('leetcode.howToGetSessionCookie')}</strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    <div>1. {t('leetcode.sessionCookieStep1')}</div>
                    <div>2. {t('leetcode.sessionCookieStep2')}</div>
                    <div>3. {t('leetcode.sessionCookieStep3')}</div>
                    <div>4. {t('leetcode.sessionCookieStep4')}</div>
                    <div>5. {t('leetcode.sessionCookieStep5')}</div>
                  </div>
                </div>
              </div>
            }
          >
            <Input.Password
              placeholder="LEETCODE_SESSION cookie value"
              size="large"
            />
          </Form.Item>


        </Form>
      )
    }
  ];

  return (
    <Modal
      title={t('leetcode.configTitle')}
      open={visible}
      onCancel={onCancel}
      footer={[
        <div key="footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            icon={<CheckCircleOutlined />}
            loading={testing}
            onClick={testConnection}
          >
            {t('leetcode.testConnection')}
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
              {t('leetcode.saveConfig')}
            </Button>
          </div>
        </div>
      ]}
      width={700}
    >
      <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />
      {steps[currentStep].content}
    </Modal>
  );
};

export default LeetCodeIntegrationModal;
