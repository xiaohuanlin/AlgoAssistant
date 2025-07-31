import React, { useState, useEffect } from 'react';
import { Form, Input, message } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import leetcodeService from '../services/leetcodeService';
import ConfigModal from './common/ConfigModal';

const LeetCodeIntegrationModal = ({
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
        form.setFieldsValue({});
      }
    }
  }, [visible, initialValues, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const configData = {
        session_cookie: values.sessionCookie,
        username: values.username || '',
      };
      await leetcodeService.updateLeetCodeConfig(configData);
      message.success(t('leetcode.configSaved'));
      onSuccess && onSuccess(values);
      onCancel();
    } catch (error) {
      message.error(t('leetcode.configError') + ': ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      if (!values.sessionCookie) {
        message.warning(t('leetcode.configRequired'));
        return { success: false };
      }

      const response = await leetcodeService.testLeetCodeConnection();
      if (response.status === 'success') {
        message.success(t('leetcode.connectionSuccess'));
        return { success: true };
      } else {
        message.error(t('leetcode.connectionFailed') + ': ' + response.message);
        return { success: false };
      }
    } catch (error) {
      if (error.errorFields) {
        message.warning(t('leetcode.configRequired'));
        return { success: false };
      }
      message.error(t('leetcode.connectionError') + ': ' + error.message);
      throw error;
    }
  };

  const helpSections = [
    {
      title: t('leetcode.howToGetSessionCookie'),
      steps: [
        t('leetcode.sessionCookieStep1'),
        t('leetcode.sessionCookieStep2'),
        t('leetcode.sessionCookieStep3'),
        t('leetcode.sessionCookieStep4'),
        t('leetcode.sessionCookieStep5'),
      ],
    },
  ];

  return (
    <ConfigModal
      visible={visible}
      onCancel={onCancel}
      title={t('leetcode.title')}
      icon={<CodeOutlined />}
      description={t('leetcode.description')}
      width={700}
      onSave={handleSave}
      onTest={handleTestConnection}
      loading={loading}
      testLoading={testing}
      form={form}
      helpSections={helpSections}
      okText={t('leetcode.saveConfig')}
    >
      <Form.Item
        name="sessionCookie"
        label={t('leetcode.sessionCookie')}
        rules={[
          { required: true, message: t('leetcode.sessionCookieRequired') },
        ]}
      >
        <Input.Password
          placeholder={t('leetcode.sessionCookiePlaceholder')}
          size="large"
        />
      </Form.Item>
    </ConfigModal>
  );
};

export default LeetCodeIntegrationModal;
