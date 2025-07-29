import React, { useState } from 'react';
import { Form, Input, message, Alert } from 'antd';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import authService from '../services/authService';
import ConfigModal from './common/ConfigModal';

const PasswordChangeModal = ({ visible, onCancel, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      // 这里需要后端提供修改密码的API
      await authService.changePassword({
        current_password: values.currentPassword,
        new_password: values.newPassword
      });

      message.success(t('passwordChange.success') || 'Password changed successfully');
      form.resetFields();
      onSuccess && onSuccess();
      onCancel();
    } catch (error) {
      message.error(t('passwordChange.error') + ': ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const validateNewPassword = (_, value) => {
    if (!value) {
      return Promise.reject(new Error(t('passwordChange.newPasswordRequired')));
    }
    if (value.length < 6) {
      return Promise.reject(new Error(t('passwordChange.passwordMinLength')));
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return Promise.reject(new Error(t('passwordChange.passwordPattern')));
    }
    return Promise.resolve();
  };

  const validateConfirmPassword = (_, value) => {
    if (!value) {
      return Promise.reject(new Error(t('passwordChange.confirmPasswordRequired')));
    }
    if (value !== form.getFieldValue('newPassword')) {
      return Promise.reject(new Error(t('passwordChange.passwordMismatch')));
    }
    return Promise.resolve();
  };

  const helpSections = [
    {
      title: t('passwordChange.securityTips') || 'Password Security Tips',
      steps: [
        t('passwordChange.securityTip1'),
        t('passwordChange.securityTip2'),
        t('passwordChange.securityTip3'),
        t('passwordChange.securityTip4'),
        t('passwordChange.securityTip5')
      ]
    }
  ];

  return (
    <ConfigModal
      visible={visible}
      onCancel={onCancel}
      title={t('passwordChange.title') || 'Change Password'}
      icon={<LockOutlined />}
      description={t('passwordChange.description') || 'Update your account password for better security'}
      width={500}
      onSave={handleSave}
      loading={loading}
      form={form}
      helpSections={helpSections}
      okText={t('passwordChange.changePassword') || 'Change Password'}
    >
      <Alert
        message={t('passwordChange.warning') || 'Security Notice'}
        description={t('passwordChange.warningDesc') || 'After changing your password, you will need to log in again on all devices.'}
        type="warning"
        showIcon
        icon={<SafetyOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Form.Item
        name="currentPassword"
        label={t('passwordChange.currentPassword') || 'Current Password'}
        rules={[
          { required: true, message: t('passwordChange.currentPasswordRequired') }
        ]}
      >
        <Input.Password
          placeholder={t('passwordChange.currentPasswordPlaceholder')}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="newPassword"
        label={t('passwordChange.newPassword') || 'New Password'}
        rules={[
          { validator: validateNewPassword }
        ]}
        hasFeedback
      >
        <Input.Password
          placeholder={t('passwordChange.newPasswordPlaceholder')}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label={t('passwordChange.confirmPassword') || 'Confirm New Password'}
        rules={[
          { validator: validateConfirmPassword }
        ]}
        hasFeedback
      >
        <Input.Password
          placeholder={t('passwordChange.confirmPasswordPlaceholder')}
          size="large"
        />
      </Form.Item>
    </ConfigModal>
  );
};

export default PasswordChangeModal;
