import React, { useState, useEffect } from 'react';
import { Form, Input, message, Alert } from 'antd';
import {
  LockOutlined,
  SafetyOutlined,
  GoogleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import authService from '../services/authService';
import ConfigModal from './common/ConfigModal';

const PasswordChangeModal = ({ visible, onCancel, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userAuthType, setUserAuthType] = useState(null);
  const [checkingAuthType, setCheckingAuthType] = useState(true);

  useEffect(() => {
    if (visible) {
      checkUserAuthType();
    }
  }, [visible]);

  const checkUserAuthType = async () => {
    try {
      setCheckingAuthType(true);
      const authType = await authService.getUserAuthType();
      setUserAuthType(authType);
    } catch (error) {
      message.error('Failed to load user information');
    } finally {
      setCheckingAuthType(false);
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      if (userAuthType?.is_oauth_user) {
        // OAuth user setting password for the first time
        await authService.setPassword({
          new_password: values.newPassword,
        });
        message.success(
          t('passwordChange.setSuccess') || 'Password set successfully',
        );
      } else {
        // Regular user changing password
        await authService.changePassword({
          current_password: values.currentPassword,
          new_password: values.newPassword,
        });
        message.success(
          t('passwordChange.success') || 'Password changed successfully',
        );
      }

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
      return Promise.reject(
        new Error(t('passwordChange.confirmPasswordRequired')),
      );
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
        t('passwordChange.securityTip5'),
      ],
    },
  ];

  const isOAuthUser = userAuthType?.is_oauth_user;
  const modalTitle = isOAuthUser
    ? t('passwordChange.setTitle') || 'Set Password'
    : t('passwordChange.title') || 'Change Password';
  const modalDescription = isOAuthUser
    ? t('passwordChange.setDescription') ||
      'Set a password for your Google account to enable password login'
    : t('passwordChange.description') ||
      'Update your account password for better security';
  const okText = isOAuthUser
    ? t('passwordChange.setPassword') || 'Set Password'
    : t('passwordChange.changePassword') || 'Change Password';

  if (checkingAuthType) {
    return null; // or a loading spinner
  }

  return (
    <ConfigModal
      visible={visible}
      onCancel={onCancel}
      title={modalTitle}
      icon={isOAuthUser ? <GoogleOutlined /> : <LockOutlined />}
      description={modalDescription}
      width={500}
      onSave={handleSave}
      loading={loading}
      form={form}
      helpSections={helpSections}
      okText={okText}
    >
      <Alert
        message={
          isOAuthUser
            ? t('passwordChange.oauthNotice') || 'Google Account Notice'
            : t('passwordChange.warning') || 'Security Notice'
        }
        description={
          isOAuthUser
            ? t('passwordChange.oauthNoticeDesc') ||
              'You are currently logged in via Google. Setting a password will allow you to log in with email and password as well.'
            : t('passwordChange.warningDesc') ||
              'After changing your password, you will need to log in again on all devices.'
        }
        type={isOAuthUser ? 'info' : 'warning'}
        showIcon
        icon={isOAuthUser ? <GoogleOutlined /> : <SafetyOutlined />}
        style={{ marginBottom: 24 }}
      />

      {!isOAuthUser && (
        <Form.Item
          name="currentPassword"
          label={t('passwordChange.currentPassword') || 'Current Password'}
          rules={[
            {
              required: true,
              message: t('passwordChange.currentPasswordRequired'),
            },
          ]}
        >
          <Input.Password
            placeholder={t('passwordChange.currentPasswordPlaceholder')}
            size="large"
          />
        </Form.Item>
      )}

      <Form.Item
        name="newPassword"
        label={t('passwordChange.newPassword') || 'New Password'}
        rules={[{ validator: validateNewPassword }]}
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
        rules={[{ validator: validateConfirmPassword }]}
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
