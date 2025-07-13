import React from 'react';
import { Card, Button, Tag, Space } from 'antd';
import { useTranslation } from 'react-i18next';

const IntegrationCard = ({
  title,
  icon,
  description,
  status,
  onConfigure,
  loading = false,
  children
}) => {
  const { t } = useTranslation();

  const getStatusColor = (status) => {
    switch (status) {
      case 'configured':
        return 'success';
      case 'not_configured':
        return 'default';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'configured':
        return t('common.configured');
      case 'not_configured':
        return t('common.notConfigured');
      case 'error':
        return t('common.error');
      default:
        return t('common.unknown');
    }
  };

  return (
    <Card
      size="small"
      style={{ height: '100%' }}
      loading={loading}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        {icon}
        <Space style={{ flex: 1, marginLeft: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: '500' }}>{title}</span>
          <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
        </Space>
      </div>

      {description && (
        <div style={{ marginBottom: '12px', color: '#666', fontSize: '12px' }}>
          {description}
        </div>
      )}

      {children}

      <Button
        type="primary"
        size="small"
        onClick={onConfigure}
        style={{ marginTop: '8px' }}
      >
        {status === 'configured' ? t('common.update') : t('common.configure')}
      </Button>
    </Card>
  );
};

export default IntegrationCard;
