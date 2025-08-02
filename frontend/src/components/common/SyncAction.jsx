import React from 'react';
import { Button, Tooltip, message } from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const SyncAction = ({
  status = 'not_synced',
  onSync,
  onRetry,
  type = 'github', // github, notion, gemini
  size = 'small',
  disabled = false,
  record = null,
  className = '',
}) => {
  const { t } = useTranslation();

  const getStatusConfig = (status) => {
    const configs = {
      not_synced: {
        icon: <SyncOutlined />,
        type: 'default',
        text: t('common.sync'),
        tooltip: t(`${type}.syncTooltip`),
        onClick: onSync,
      },
      syncing: {
        icon: <LoadingOutlined />,
        type: 'primary',
        text: t('records.syncing'),
        tooltip: t(`${type}.syncingTooltip`),
        loading: true,
        disabled: true,
      },
      synced: {
        icon: <CheckCircleOutlined />,
        type: 'default',
        text: t('records.synced'),
        tooltip: t(`${type}.syncTooltip`),
        onClick: onSync,
      },
      failed: {
        icon: <CloseCircleOutlined />,
        type: 'danger',
        text: t('common.retry'),
        tooltip: t(`${type}.retryTooltip`),
        onClick: onRetry || onSync,
      },
      paused: {
        icon: <PauseCircleOutlined />,
        type: 'default',
        text: t('common.retry'),
        tooltip: t(`${type}.retryTooltip`),
        onClick: onRetry || onSync,
      },
    };

    return configs[status] || configs.not_synced;
  };

  const config = getStatusConfig(status);

  const handleClick = async () => {
    if (!config.onClick || disabled) return;

    try {
      await config.onClick(record);
      message.success(t(`${type}.syncStarted`));
    } catch (error) {
      message.error(t(`${type}.syncError`));
    }
  };

  const button = (
    <Button
      type={config.type}
      size={size}
      icon={config.icon}
      onClick={handleClick}
      loading={config.loading}
      disabled={disabled || config.disabled}
      danger={config.type === 'danger'}
      className={className}
    >
      {config.text}
    </Button>
  );

  return config.tooltip ? (
    <Tooltip title={config.tooltip}>{button}</Tooltip>
  ) : (
    button
  );
};

export default SyncAction;
