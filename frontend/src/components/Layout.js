import React, { useState, useEffect } from 'react';
import {
  Layout as AntLayout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Badge,
  Tooltip,
} from 'antd';
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
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './common/LanguageSwitcher';
import ModernBreadcrumb from './common/ModernBreadcrumb';
import { isMobile } from '../utils';
import '../styles/Layout.css';

const { Header, Sider, Content } = AntLayout;

// Modern layout styles with gradients and glass morphism
const LAYOUT_STYLES = {
  mainLayout: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '0 24px',
    height: '70px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  },
  headerMobile: {
    padding: '0 16px',
    height: '60px',
  },
  brandSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  toggleButton: {
    fontSize: '18px',
    background: 'transparent',
    border: 'none',
    color: '#1890ff',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  title: {
    margin: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily:
      '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  notificationButton: {
    background: 'rgba(103, 126, 234, 0.1)',
    border: '1px solid rgba(103, 126, 234, 0.2)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    borderRadius: '25px',
    background: 'rgba(255, 255, 255, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  userName: {
    fontWeight: '500',
    color: '#2c3e50',
    fontSize: '14px',
  },
  avatar: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: '2px solid rgba(255, 255, 255, 0.8)',
  },
  sider: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(15px)',
    borderRadius: '0 20px 20px 0',
    margin: '16px 0 16px 16px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  siderMobile: {
    position: 'fixed',
    left: 0,
    top: '60px',
    height: 'calc(100vh - 60px)',
    zIndex: 99,
    margin: 0,
    borderRadius: 0,
  },
  menu: {
    background: 'transparent',
    border: 'none',
    padding: '20px 0',
  },
  content: {
    margin: '16px 16px 16px 0',
    padding: '32px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    minHeight: 'calc(100vh - 102px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  contentMobile: {
    margin: '16px',
    padding: '20px',
    minHeight: 'calc(100vh - 92px)',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 98,
  },
};

const Layout = ({ children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Responsive state
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [siderVisible, setSiderVisible] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = isMobile();
      setIsMobileView(mobile);
      if (mobile) {
        setCollapsed(true);
        setSiderVisible(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      navigate('/login');
    }
  };

  const toggleSider = () => {
    if (isMobileView) {
      setSiderVisible(!siderVisible);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const closeMobileSider = () => {
    if (isMobileView) {
      setSiderVisible(false);
    }
  };

  // Enhanced menu configuration
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <span style={{ fontWeight: '500' }}>{t('navigation.profile')}</span>
      ),
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: (
        <span style={{ fontWeight: '500' }}>{t('navigation.settings')}</span>
      ),
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: (
        <span style={{ fontWeight: '500', color: '#ff4d4f' }}>
          {t('navigation.logout')}
        </span>
      ),
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined style={{ fontSize: '18px' }} />,
      label: (
        <span style={{ fontSize: '15px', fontWeight: '500' }}>
          {t('navigation.dashboard')}
        </span>
      ),
      onClick: () => {
        navigate('/');
        closeMobileSider();
      },
    },
    {
      key: '/problem',
      icon: <BookOutlined style={{ fontSize: '18px' }} />,
      label: (
        <span style={{ fontSize: '15px', fontWeight: '500' }}>
          {t('navigation.problem')}
        </span>
      ),
      onClick: () => {
        navigate('/problem');
        closeMobileSider();
      },
    },
    {
      key: '/records',
      icon: <FileTextOutlined style={{ fontSize: '18px' }} />,
      label: (
        <span style={{ fontSize: '15px', fontWeight: '500' }}>
          {t('navigation.records')}
        </span>
      ),
      onClick: () => {
        navigate('/records');
        closeMobileSider();
      },
    },
    {
      key: '/review',
      icon: <BookOutlined style={{ fontSize: '18px' }} />,
      label: (
        <span style={{ fontSize: '15px', fontWeight: '500' }}>
          {t('navigation.review')}
        </span>
      ),
      onClick: () => {
        navigate('/review');
        closeMobileSider();
      },
    },
    {
      key: '/sync-tasks',
      icon: <SyncOutlined style={{ fontSize: '18px' }} />,
      label: (
        <span style={{ fontSize: '15px', fontWeight: '500' }}>
          {t('navigation.syncTasks')}
        </span>
      ),
      onClick: () => {
        navigate('/sync-tasks');
        closeMobileSider();
      },
    },
    {
      key: '/settings',
      icon: <SettingOutlined style={{ fontSize: '18px' }} />,
      label: (
        <span style={{ fontSize: '15px', fontWeight: '500' }}>
          {t('navigation.settings')}
        </span>
      ),
      onClick: () => {
        navigate('/settings');
        closeMobileSider();
      },
    },
  ];

  // Get currently selected menu item
  const getSelectedKeys = () => {
    const pathname = location.pathname;
    const pathMappings = {
      '/': ['/'],
      '/problem': ['/problem'],
      '/records': ['/records'],
      '/review': ['/review'],
      '/sync-tasks': ['/sync-tasks'],
      '/settings': ['/settings'],
    };

    // Check exact matches first
    if (pathMappings[pathname]) {
      return pathMappings[pathname];
    }

    // Check path prefixes
    for (const [path, keys] of Object.entries(pathMappings)) {
      if (pathname.startsWith(path) && path !== '/') {
        return keys;
      }
    }

    return [];
  };

  // Custom menu theme (currently unused but may be needed for future styling)
  // const menuTheme = {
  //   components: {
  //     Menu: {
  //       itemBg: 'transparent',
  //       itemSelectedBg: 'rgba(103, 126, 234, 0.1)',
  //       itemSelectedColor: '#667eea',
  //       itemHoverBg: 'rgba(103, 126, 234, 0.08)',
  //       itemHoverColor: '#667eea',
  //       itemColor: '#6c757d',
  //       itemHeight: 48,
  //       itemPaddingInline: 24,
  //       itemBorderRadius: 12,
  //       itemMarginInline: 12,
  //       itemMarginBlock: 4,
  //     },
  //   },
  // };

  const headerStyle = {
    ...LAYOUT_STYLES.header,
    ...(isMobileView ? LAYOUT_STYLES.headerMobile : {}),
  };

  const siderStyle = {
    ...LAYOUT_STYLES.sider,
    ...(isMobileView ? LAYOUT_STYLES.siderMobile : {}),
  };

  const contentStyle = {
    ...LAYOUT_STYLES.content,
    ...(isMobileView ? LAYOUT_STYLES.contentMobile : {}),
  };

  return (
    <AntLayout className="modern-layout" style={LAYOUT_STYLES.mainLayout}>
      {/* Header */}
      <Header className="modern-header" style={headerStyle}>
        <div className="brand-section" style={LAYOUT_STYLES.brandSection}>
          <Button
            type="text"
            icon={
              collapsed || siderVisible ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={toggleSider}
            className="toggle-button"
            style={LAYOUT_STYLES.toggleButton}
          />
          <h1 style={LAYOUT_STYLES.title}>
            {isMobileView ? 'AlgoAI' : t('app.title')}
          </h1>
        </div>

        <div style={LAYOUT_STYLES.headerRight}>
          {!isMobileView && (
            <Tooltip title="Notifications">
              <Badge count={5} size="small">
                <div
                  className="notification-button"
                  style={LAYOUT_STYLES.notificationButton}
                >
                  <BellOutlined />
                </div>
              </Badge>
            </Tooltip>
          )}

          <LanguageSwitcher mode={isMobileView ? 'select' : 'dropdown'} />

          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <div className="user-button" style={LAYOUT_STYLES.userButton}>
              <Avatar
                icon={<UserOutlined />}
                src={user?.avatar}
                style={LAYOUT_STYLES.avatar}
                size={isMobileView ? 32 : 36}
              />
              {!isMobileView && (
                <span style={LAYOUT_STYLES.userName}>
                  {user?.nickname || user?.username}
                </span>
              )}
            </div>
          </Dropdown>
        </div>
      </Header>

      {/* Mobile overlay */}
      {isMobileView && siderVisible && (
        <div style={LAYOUT_STYLES.overlay} onClick={closeMobileSider} />
      )}

      <AntLayout hasSider>
        {/* Sidebar */}
        <Sider
          width={220}
          collapsedWidth={isMobileView ? 0 : 80}
          collapsed={isMobileView ? !siderVisible : collapsed}
          className="modern-sider"
          style={siderStyle}
          theme="light"
          trigger={null}
        >
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            style={LAYOUT_STYLES.menu}
            items={menuItems}
            theme="light"
            inlineCollapsed={!isMobileView && collapsed}
          />
        </Sider>

        {/* Main content */}
        <Content className="modern-content" style={contentStyle}>
          <ModernBreadcrumb />
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
