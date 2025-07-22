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
import Review from './pages/Review';
import ReviewDetail from './pages/ReviewDetail';
import SyncTasks from './pages/SyncTasks';
import Settings from './pages/Settings';
import PrivateRoute from './components/PrivateRoute';
import { GitSyncProvider } from './contexts/GitSyncContext';
import { ConfigProvider as AppConfigProvider } from './contexts/ConfigContext';
import './i18n';
import './styles/App.css';
import GeminiIntegration from './pages/GeminiIntegration';
import RecordDetail from './pages/RecordDetail.jsx';
import ProblemList from './pages/ProblemList';
import ProblemDetail from './pages/ProblemDetail';
import ProblemCreate from './pages/ProblemCreate';
import CreateRecord from './pages/CreateRecord';

// Google OAuth Client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com";

function App() {
  const { i18n } = useTranslation();

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ConfigProvider
        locale={i18n.language === 'zh' ? require('antd/locale/zh_CN').default : require('antd/locale/en_US').default}
      >
          <GitSyncProvider>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </AppConfigProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/records"
                  element={
                    <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <Records />
                      </Layout>
                    </AppConfigProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/records/:id"
                  element={
                    <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <RecordDetail />
                      </Layout>
                    </AppConfigProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/records/create"
                  element={
                    <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <CreateRecord />
                      </Layout>
                    </AppConfigProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/review"
                  element={
                    <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <Review />
                      </Layout>
                    </AppConfigProvider>
                  </PrivateRoute>
                }
              />
              <Route
                path="/review/:id"
                element={
                  <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <ReviewDetail />
                      </Layout>
                    </AppConfigProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/sync-tasks"
                  element={
                    <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <SyncTasks />
                      </Layout>
                    </AppConfigProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <Settings />
                      </Layout>
                    </AppConfigProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/gemini-integration"
                  element={
                    <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <GeminiIntegration />
                      </Layout>
                    </AppConfigProvider>
                  </PrivateRoute>
                }
              />
              <Route
                path="/problem"
                element={
                  <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <ProblemList />
                      </Layout>
                    </AppConfigProvider>
                  </PrivateRoute>
                }
              />
              <Route
                path="/problem/create"
                element={
                  <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <ProblemCreate />
                      </Layout>
                    </AppConfigProvider>
                  </PrivateRoute>
                }
              />
              <Route
                path="/problem/:id"
                element={
                  <PrivateRoute>
                    <AppConfigProvider>
                      <Layout>
                        <ProblemDetail />
                      </Layout>
                    </AppConfigProvider>
                    </PrivateRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </GitSyncProvider>
      </ConfigProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
