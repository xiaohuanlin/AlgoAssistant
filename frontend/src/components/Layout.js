import React from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  BookOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  SyncOutlined,
  FileTextOutlined,
  RobotOutlined
} from '@ant-design/icons';
import authService from '../services/authService';
import LanguageSwitcher from './LanguageSwitcher';

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUserFromStorage();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('navigation.profile'),
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('navigation.settings'),
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('navigation.logout'),
      onClick: handleLogout
    }
  ];

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: t('navigation.dashboard'),
      onClick: () => navigate('/')
    },
    {
      key: '/problem',
      icon: <BookOutlined />,
      label: t('navigation.problem'),
      onClick: () => navigate('/problem')
    },
    {
      key: '/records',
      icon: <FileTextOutlined />,
      label: t('navigation.records'),
      onClick: () => navigate('/records')
    },
    {
      key: '/review',
      icon: <BookOutlined />,
      label: t('navigation.review'),
      onClick: () => navigate('/review')
    },
    {
      key: '/sync-tasks',
      icon: <SyncOutlined />,
      label: t('navigation.syncTasks'),
      onClick: () => navigate('/sync-tasks')
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('navigation.settings'),
      onClick: () => navigate('/settings')
    }
  ];

  // Get currently selected menu item
  const getSelectedKeys = () => {
    const pathname = location.pathname;
    if (pathname === '/') return ['/'];
    if (pathname === '/problem' || pathname.startsWith('/problem/')) return ['/problem'];
    if (pathname === '/records' || pathname.startsWith('/records/')) return ['/records'];
    if (pathname === '/review' || pathname.startsWith('/review/')) return ['/review'];
    if (pathname === '/sync-tasks' || pathname.startsWith('/sync-tasks/')) return ['/sync-tasks'];
    if (pathname === '/settings' || pathname.startsWith('/settings/')) return ['/settings'];
    return [];
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ margin: 0, color: '#1890ff' }}>{t('app.title')}</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <LanguageSwitcher />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar
                icon={<UserOutlined />}
                src={user?.avatar}
                style={{ backgroundColor: '#1890ff' }}
              />
              <span>{user?.nickname || user?.username}</span>
            </Button>
          </Dropdown>
        </div>
      </Header>

      <AntLayout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>

        <Content style={{
          margin: '24px',
          padding: '24px',
          background: '#fff',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)'
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
