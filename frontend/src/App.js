import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import Settings from './pages/Settings';
import PrivateRoute from './components/PrivateRoute';
import './i18n';
import './styles/App.css';

// Google OAuth Client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com";

function App() {
  const { i18n } = useTranslation();

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ConfigProvider
        locale={i18n.language === 'zh' ? require('antd/locale/zh_CN').default : require('antd/locale/en_US').default}
      >
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/records"
              element={
                <PrivateRoute>
                  <Layout>
                    <Records />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ConfigProvider>
    </GoogleOAuthProvider>
  );
}

export default App; 