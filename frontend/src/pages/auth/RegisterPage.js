import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, GithubOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import authService from '../../services/authService';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import './AuthPages.css';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.register({
        username: values.username,
        email: values.email,
        password: values.password,
        nickname: values.nickname || values.username,
      });

      message.success(t('auth.registerSuccess'));
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);

      // Handle specific error messages
      const errorMessage = error.message || t('auth.registerFailed');

      // If it's a validation error with multiple lines, show each line separately
      if (errorMessage.includes('\n')) {
        const lines = errorMessage.split('\n');
        lines.forEach((line, index) => {
          setTimeout(() => {
            message.error(line);
          }, index * 100); // Small delay between messages
        });
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <Card className="auth-card" bordered={false}>
          <div className="auth-header">
            <Title level={2} className="auth-title">
              <GithubOutlined className="auth-icon" />
              {t('app.title')}
            </Title>
            <Text type="secondary">{t('app.subtitle')}</Text>
          </div>

          <Divider />

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
                { min: 3, max: 32, message: t('auth.usernameMaxLength') },
                { pattern: /^[a-zA-Z0-9_]+$/, message: t('auth.usernamePattern') },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t('auth.username')}
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: t('auth.emailRequired') },
                { type: 'email', message: t('auth.emailInvalid') },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder={t('auth.email')}
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="nickname"
              rules={[
                { max: 64, message: t('auth.nicknameMaxLength') },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t('auth.nickname')}
                autoComplete="nickname"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: t('auth.passwordRequired') },
                { min: 6, message: t('auth.passwordMinLength') },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: t('auth.passwordPattern')
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('auth.password')}
                autoComplete="new-password"
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
                autoComplete="new-password"
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

          <div className="auth-footer">
            <div className="auth-links">
              <Text type="secondary">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to="/login" className="auth-link">
                  {t('auth.loginNow')}
                </Link>
              </Text>
            </div>
            <div className="auth-language">
              <LanguageSwitcher />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
