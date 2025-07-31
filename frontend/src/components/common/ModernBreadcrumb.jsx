import React from 'react';
import { Breadcrumb } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeOutlined,
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  SettingOutlined,
  SyncOutlined,
  UserOutlined,
} from '@ant-design/icons';

const ModernBreadcrumb = ({ style = {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Route to breadcrumb mapping
  const routeMap = {
    '/': {
      icon: <DashboardOutlined />,
      label: t('navigation.dashboard'),
      path: '/',
    },
    '/problem': {
      icon: <BookOutlined />,
      label: t('navigation.problem'),
      path: '/problem',
    },
    '/records': {
      icon: <FileTextOutlined />,
      label: t('navigation.records'),
      path: '/records',
    },
    '/review': {
      icon: <BookOutlined />,
      label: t('navigation.review'),
      path: '/review',
    },
    '/sync-tasks': {
      icon: <SyncOutlined />,
      label: t('navigation.syncTasks'),
      path: '/sync-tasks',
    },
    '/settings': {
      icon: <SettingOutlined />,
      label: t('navigation.settings'),
      path: '/settings',
    },
    '/profile': {
      icon: <UserOutlined />,
      label: t('navigation.profile'),
      path: '/profile',
    },
  };

  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Always start with Home
    breadcrumbs.push({
      title: (
        <span
          onClick={() => navigate('/')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#667eea',
            fontWeight: '500',
          }}
        >
          <HomeOutlined />
          Home
        </span>
      ),
      key: 'home',
    });

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const route = routeMap[currentPath];

      if (route) {
        const isLast = index === pathSegments.length - 1;
        breadcrumbs.push({
          title: (
            <span
              onClick={!isLast ? () => navigate(currentPath) : undefined}
              style={{
                cursor: !isLast ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: isLast ? '#2c3e50' : '#667eea',
                fontWeight: isLast ? '600' : '500',
              }}
            >
              {route.icon}
              {route.label}
            </span>
          ),
          key: currentPath,
        });
      } else {
        // Handle dynamic routes (e.g., /records/123)
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        const parentRoute = routeMap[parentPath];

        if (parentRoute) {
          breadcrumbs.push({
            title: (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#2c3e50',
                  fontWeight: '600',
                }}
              >
                {parentRoute.icon}
                {segment.charAt(0).toUpperCase() + segment.slice(1)}
              </span>
            ),
            key: currentPath,
          });
        }
      }
    });

    return breadcrumbs;
  };

  const containerStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '12px 20px',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
    ...style,
  };

  return (
    <div style={containerStyle}>
      <Breadcrumb
        items={generateBreadcrumbs()}
        separator="/"
        style={{
          fontSize: '14px',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      />
    </div>
  );
};

export default ModernBreadcrumb;
