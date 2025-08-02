import React from 'react';
import { Card, Button, Tag, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const ConfigCard = ({
  title,
  icon,
  description,
  status = 'not_configured',
  onConfigure,
  onTest,
  loading = false,
  testLoading = false,
  children,
  actions = [],
  className = '',
}) => {
  const { t } = useTranslation();

  const getStatusConfig = (status) => {
    const configs = {
      configured: {
        color: 'success',
        text: t('common.configured'),
      },
      not_configured: {
        color: 'default',
        text: t('common.notConfigured'),
      },
      error: {
        color: 'error',
        text: t('common.error'),
      },
      testing: {
        color: 'processing',
        text: t('common.testing'),
      },
    };
    return configs[status] || configs.not_configured;
  };

  const statusConfig = getStatusConfig(status);

  const renderActions = () => {
    const defaultActions = [];

    if (onConfigure) {
      defaultActions.push(
        <Button
          key="configure"
          type={status === 'configured' ? 'default' : 'primary'}
          size="small"
          onClick={onConfigure}
          loading={loading}
        >
          {status === 'configured' ? t('common.update') : t('common.configure')}
        </Button>,
      );
    }

    if (onTest && status === 'configured') {
      defaultActions.push(
        <Button key="test" size="small" onClick={onTest} loading={testLoading}>
          {t('git.testConnection')}
        </Button>,
      );
    }

    return [...defaultActions, ...actions];
  };

  return (
    <Card
      className={`config-card ${className}`}
      size="small"
      loading={loading}
      style={{ height: '100%' }}
    >
      <div className="config-card-header">
        <div className="config-card-title">
          <Space>
            {icon}
            <Text strong style={{ fontSize: '16px' }}>
              {title}
            </Text>
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
          </Space>
        </div>
      </div>

      {description && (
        <div className="config-card-description">
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {description}
          </Text>
        </div>
      )}

      {children && (
        <div className="config-card-content" style={{ margin: '12px 0' }}>
          {children}
        </div>
      )}

      <div className="config-card-actions" style={{ marginTop: '12px' }}>
        <Space size="small">{renderActions()}</Space>
      </div>
    </Card>
  );
};

export default ConfigCard;
