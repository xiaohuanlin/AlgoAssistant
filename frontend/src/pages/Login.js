import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleLogin from '../components/auth/GoogleLogin';
import '../styles/Login.css';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values);
      message.success(t('auth.loginSuccess'));
      navigate('/');
    } catch (error) {
      // Handle special error codes for better i18n
      let errorMessage = error.message || t('auth.loginFailed');
      if (error.message === 'INVALID_CREDENTIALS') {
        errorMessage = t('auth.invalidCredentials');
      } else if (error.message === 'AUTHENTICATION_FAILED') {
        errorMessage = t('auth.loginFailed');
      }
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title={t('auth.login')}>
        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
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
            name="password"
            rules={[
              { required: true, message: t('auth.passwordRequired') },
              { min: 6, message: t('auth.passwordMinLength') },
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

        <GoogleLogin />

        <div className="login-footer">
          <span>{t('auth.dontHaveAccount')}</span>
          <Link to="/register">{t('auth.registerNow')}</Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
