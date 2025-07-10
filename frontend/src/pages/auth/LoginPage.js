import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, GithubOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import authService from '../../services/authService';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import './AuthPages.css';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.login({
        username: values.username,
        password: values.password,
      });
      
      message.success(t('auth.loginSuccess'));
      navigate('/');
    } catch (error) {
      message.error(error.message || t('auth.loginFailed'));
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
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: t('auth.usernameRequired') },
                { min: 3, message: t('auth.usernameMinLength') },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t('auth.username')}
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: t('auth.passwordRequired') },
                { min: 6, message: t('auth.passwordMinLength') },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('auth.password')}
                autoComplete="current-password"
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
                {t('auth.login')}
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-footer">
            <div className="auth-links">
              <Text type="secondary">
                {t('auth.dontHaveAccount')}{' '}
                <Link to="/register" className="auth-link">
                  {t('auth.registerNow')}
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

export default LoginPage; 