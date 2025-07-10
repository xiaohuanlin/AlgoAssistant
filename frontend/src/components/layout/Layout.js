import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Space } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  DashboardOutlined,
  CodeOutlined,
  BookOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  GithubOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import authService from '../../services/authService';
import LanguageSwitcher from '../common/LanguageSwitcher';
import './Layout.css';

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentUser = authService.getCurrentUserFromStorage();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('navigation.profile'),
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('navigation.settings'),
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('navigation.logout'),
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: t('navigation.dashboard'),
      onClick: () => navigate('/'),
    },
    {
      key: '/records',
      icon: <CodeOutlined />,
      label: t('navigation.records'),
      onClick: () => navigate('/records'),
    },
    {
      key: '/review',
      icon: <BookOutlined />,
      label: t('navigation.review'),
      onClick: () => navigate('/review'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('navigation.settings'),
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <AntLayout className="app-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="app-sider"
      >
        <div className="logo">
          <GithubOutlined className="logo-icon" />
          {!collapsed && <span className="logo-text">{t('app.title')}</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/']}
          items={menuItems}
          className="app-menu"
        />
      </Sider>
      
      <AntLayout>
        <Header className="app-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="trigger-button"
          />
          
          <div className="header-right">
            <Space>
              <LanguageSwitcher />
              <span className="welcome-text">
                {t('app.welcome')}, {currentUser?.nickname || currentUser?.username}
              </span>
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                arrow
              >
                <Avatar 
                  size="large" 
                  icon={<UserOutlined />}
                  className="user-avatar"
                />
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content className="app-content">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout; 