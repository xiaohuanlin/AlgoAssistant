import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

// Layout and Auth Components
import Layout from './components/Layout';
import PrivateRoute from './components/common/PrivateRoute';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { GitSyncProvider } from './contexts/GitSyncContext';
import { ConfigProvider as AppConfigProvider } from './contexts/ConfigContext';

// Page Components
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import RecordDetail from './pages/RecordDetail';
import CreateRecord from './pages/CreateRecord';
import Review from './pages/Review';
import ReviewDetail from './pages/ReviewDetail';
import SyncTasks from './pages/SyncTasks';
import Settings from './pages/Settings';
import GeminiIntegration from './pages/GeminiIntegration';
import ProblemList from './pages/ProblemList';
import ProblemDetail from './pages/ProblemDetail';
import ProblemCreate from './pages/ProblemCreate';

// Styles and i18n
import './i18n';
import './styles/App.css';

// Configuration
const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  'your-google-client-id.apps.googleusercontent.com';

// Route configuration for better maintainability
const createProtectedRoute = (Component) => (
  <PrivateRoute>
    <AppConfigProvider>
      <Layout>
        <Component />
      </Layout>
    </AppConfigProvider>
  </PrivateRoute>
);

function App() {
  const { i18n } = useTranslation();

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ConfigProvider locale={i18n.language === 'zh' ? zhCN : enUS}>
        <ErrorProvider>
          <AuthProvider>
            <GitSyncProvider>
              <div className="App">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Routes */}
                  <Route path="/" element={createProtectedRoute(Dashboard)} />
                  <Route
                    path="/records"
                    element={createProtectedRoute(Records)}
                  />
                  <Route
                    path="/records/:id"
                    element={createProtectedRoute(RecordDetail)}
                  />
                  <Route
                    path="/records/create"
                    element={createProtectedRoute(CreateRecord)}
                  />
                  <Route
                    path="/review"
                    element={createProtectedRoute(Review)}
                  />
                  <Route
                    path="/review/:id"
                    element={createProtectedRoute(ReviewDetail)}
                  />
                  <Route
                    path="/sync-tasks"
                    element={createProtectedRoute(SyncTasks)}
                  />
                  <Route
                    path="/settings"
                    element={createProtectedRoute(Settings)}
                  />
                  <Route
                    path="/gemini-integration"
                    element={createProtectedRoute(GeminiIntegration)}
                  />
                  <Route
                    path="/problem"
                    element={createProtectedRoute(ProblemList)}
                  />
                  <Route
                    path="/problem/create"
                    element={createProtectedRoute(ProblemCreate)}
                  />
                  <Route
                    path="/problem/:id"
                    element={createProtectedRoute(ProblemDetail)}
                  />

                  {/* Fallback Route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </GitSyncProvider>
          </AuthProvider>
        </ErrorProvider>
      </ConfigProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
