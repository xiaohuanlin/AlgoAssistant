import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await register(values);
      message.success(t('auth.registerSuccess'), 3);
      // Delay navigation to show success message
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      message.error(error.message || t('auth.registerFailed'));
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title={t('auth.register')}>
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: t('auth.usernameRequired') },
              { min: 3, message: t('auth.usernameMinLength') },
              { max: 32, message: t('auth.usernameMaxLength') },
              {
                pattern: /^[a-zA-Z0-9_]+$/,
                message: t('auth.usernamePattern'),
              },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('auth.username')} />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('auth.emailRequired') },
              { type: 'email', message: t('auth.emailInvalid') },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder={t('auth.email')} />
          </Form.Item>

          <Form.Item
            name="nickname"
            rules={[{ max: 64, message: t('auth.nicknameMaxLength') }]}
          >
            <Input
              prefix={<SmileOutlined />}
              placeholder={t('auth.nickname')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: t('auth.passwordRequired') },
              { min: 6, message: t('auth.passwordMinLength') },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: t('auth.passwordPattern'),
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.password')}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: t('auth.confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('auth.passwordMismatch')));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.confirmPassword')}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              {t('auth.register')}
            </Button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <span>{t('auth.alreadyHaveAccount')}</span>
          <Link to="/login">{t('auth.loginNow')}</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
