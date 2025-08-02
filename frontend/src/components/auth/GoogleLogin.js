import React from 'react';
import { Button, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useGoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const GoogleLogin = ({ onSuccess, onError }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { initializeAuth } = useAuth();

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        // Login with backend using access token
        const result = await authService.googleLogin(response.access_token);

        // Update AuthContext state after successful login
        await initializeAuth();

        if (onSuccess) {
          onSuccess(result);
        } else {
          message.success(t('auth.googleLoginSuccess'));
          navigate('/');
        }
      } catch (error) {
        message.error(t('auth.googleLoginFailed') + ': ' + error.message);
        if (onError) {
          onError(error);
        }
      }
    },
    onError: (error) => {
      message.error(t('auth.googleLoginFailed'));
      if (onError) {
        onError(error);
      }
    },
  });

  return (
    <Button
      type="default"
      icon={<GoogleOutlined />}
      onClick={() => login()}
      size="large"
      block
      style={{
        height: 44,
        borderColor: '#db4437',
        color: '#db4437',
        marginBottom: 16,
      }}
    >
      {t('auth.loginWithGoogle')}
    </Button>
  );
};

export default GoogleLogin;
