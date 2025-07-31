import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  Avatar,
  Upload,
  message,
  Divider,
  Typography,
  Space,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatLocalTime } from '../utils';
import authService from '../services/authService';
import ConfigModal from './common/ConfigModal';

const { Text, Title } = Typography;

const AccountSettingsModal = ({
  visible,
  onCancel,
  onSuccess,
  initialValues,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      setAvatarUrl(user.avatar);
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        nickname: user.nickname || '',
      });
    } catch (error) {
      message.error('Failed to load user information');
    }
  }, [form]);

  useEffect(() => {
    if (visible) {
      loadCurrentUser();
    }
  }, [visible, loadCurrentUser]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const updateData = {
        ...values,
        avatar: avatarUrl,
      };

      await authService.updateProfile(updateData);
      message.success(
        t('accountSettings.updateSuccess') || 'Profile updated successfully',
      );
      onSuccess && onSuccess(updateData);
      onCancel();
    } catch (error) {
      message.error(t('accountSettings.updateError') + ': ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // Get uploaded URL
      const url =
        info.file.response?.url || URL.createObjectURL(info.file.originFileObj);
      setAvatarUrl(url);
      setLoading(false);
      message.success('Avatar uploaded successfully');
    }
    if (info.file.status === 'error') {
      setLoading(false);
      message.error('Avatar upload failed');
    }
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
      return false;
    }
    return true;
  };

  // const uploadButton = (
  //   <div>
  //     <UploadOutlined />
  //     <div style={{ marginTop: 8 }}>Upload</div>
  //   </div>
  // );

  return (
    <ConfigModal
      visible={visible}
      onCancel={onCancel}
      title={t('accountSettings.title') || 'Account Settings'}
      icon={<UserOutlined />}
      description={
        t('accountSettings.description') ||
        'Manage your account information and preferences'
      }
      width={600}
      onSave={handleSave}
      loading={loading}
      form={form}
      okText={t('common.save')}
    >
      {/* Avatar Upload Area */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={5}>
          {t('accountSettings.avatar') || 'Profile Picture'}
        </Title>
        <Space direction="vertical" align="center">
          <Avatar
            size={80}
            src={avatarUrl}
            icon={<UserOutlined />}
            style={{ border: '2px solid #f0f0f0' }}
          />
          <Upload
            name="avatar"
            listType="picture"
            showUploadList={false}
            action="/api/users/upload-avatar" // Backend upload API
            beforeUpload={beforeUpload}
            onChange={handleAvatarChange}
          >
            <Text
              type="secondary"
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t('accountSettings.changeAvatar') || 'Change Avatar'}
            </Text>
          </Upload>
        </Space>
      </div>

      <Divider />

      {/* Basic Information Form */}
      <Form.Item
        name="username"
        label={t('accountSettings.username') || 'Username'}
        rules={[
          { required: true, message: 'Please enter username!' },
          { min: 3, max: 32, message: 'Username must be 3-32 characters!' },
          {
            pattern: /^[a-zA-Z0-9_]+$/,
            message:
              'Username can only contain letters, numbers and underscore!',
          },
        ]}
      >
        <Input placeholder="Enter your username" />
      </Form.Item>

      <Form.Item
        name="email"
        label={t('accountSettings.email') || 'Email'}
        rules={[
          { required: true, message: 'Please enter email!' },
          { type: 'email', message: 'Please enter a valid email!' },
        ]}
      >
        <Input placeholder="Enter your email" />
      </Form.Item>

      <Form.Item
        name="nickname"
        label={t('accountSettings.nickname') || 'Nickname'}
        rules={[{ max: 50, message: 'Nickname cannot exceed 50 characters!' }]}
      >
        <Input placeholder="Enter your display name" />
      </Form.Item>

      {/* Current User Information Display */}
      {currentUser && (
        <>
          <Divider />
          <div style={{ background: '#fafafa', padding: 16, borderRadius: 6 }}>
            <Title level={5} style={{ marginBottom: 8 }}>
              {t('accountSettings.accountInfo') || 'Account Information'}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('accountSettings.createdAt') || 'Created'}:{' '}
              {formatLocalTime(currentUser.created_at, 'YYYY-MM-DD')}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('accountSettings.lastUpdated') || 'Last Updated'}:{' '}
              {formatLocalTime(currentUser.updated_at, 'YYYY-MM-DD')}
            </Text>
          </div>
        </>
      )}
    </ConfigModal>
  );
};

export default AccountSettingsModal;
