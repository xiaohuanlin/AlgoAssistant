import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import GoogleLogin from '../components/auth/GoogleLogin';
import '../styles/Login.css';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.login(values);
      message.success(t('auth.loginSuccess'));
      navigate('/');
    } catch (error) {
      message.error(error.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (result) => {
    message.success(t('auth.googleLoginSuccess'));
    navigate('/');
  };

  const handleGoogleError = (error) => {
    message.error(t('auth.googleLoginFailed'));
  };

  return (
    <div className="login-container">
      <Card className="login-card" title={t('auth.login')}>
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
              { max: 32, message: t('auth.usernameMaxLength') },
              { pattern: /^[a-zA-Z0-9_]+$/, message: t('auth.usernamePattern') }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('auth.username')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: t('auth.passwordRequired') },
              { min: 6, message: t('auth.passwordMinLength') }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.password')}
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

        <Divider>{t('auth.or')}</Divider>

        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        <div className="login-footer">
          <span>{t('auth.dontHaveAccount')}</span>
          <Link to="/register">{t('auth.registerNow')}</Link>
        </div>
      </Card>
    </div>
  );
};

export default Login; 