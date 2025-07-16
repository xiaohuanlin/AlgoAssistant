import React, { useState } from 'react';
import { Button, message, Tooltip } from 'antd';
import { SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useGitSync } from '../contexts/GitSyncContext';

const GitSyncAction = ({ record, onSync, disabled }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { config, loading: configLoading } = useGitSync();

  const gitConfigured = !!(config && config.token && config.repo_url);

  const handleSync = async () => {
    if (disabled) return;
    if (!record || !record.id) {
      message.error(t('git.invalidRecord'));
      return;
    }

    if (!gitConfigured) {
      message.error(t('git.configRequired'));
      return;
    }

    setLoading(true);
    try {
      // Still call service directly here, context can also expose methods
      const gitSyncService = require('../services/gitSyncService').default;
      await gitSyncService.syncToGit([record.id]);
      message.success(t('git.syncStarted'));
      onSync && onSync();
    } catch (error) {
      message.error(t('git.syncError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // If already synced, show button to jump to repo
  if (record?.git_sync_status === 'synced' && record?.git_file_path) {
    return (
      <Tooltip title={t('git.viewRepo')}>
        <Button
          type="link"
          size="small"
          href={record.git_file_path}
          target="_blank"
          rel="noopener noreferrer"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          style={{ padding: '4px 8px', height: 'auto', lineHeight: '1.2' }}
          disabled={disabled}
        >
          {t('git.viewRepo')}
        </Button>
      </Tooltip>
    );
  }

  // If already synced, do not show button
  if (record?.git_sync_status === 'synced') {
    return null;
  }

  // If config check is not finished, show loading state
  if (configLoading) {
    return (
      <Button
        type="text"
        size="small"
        disabled
        icon={<SyncOutlined spin />}
        style={{
          padding: '4px 8px',
          height: 'auto',
          lineHeight: '1.2',
          color: '#999'
        }}
      >
        {t('common.loading')}
      </Button>
    );
  }

  // If GitHub is not configured, show gray button
  if (!gitConfigured) {
    return (
      <Tooltip title={t('git.configRequired')}>
        <Button
          type="text"
          size="small"
          disabled
          icon={<SyncOutlined />}
          style={{
            padding: '4px 8px',
            height: 'auto',
            lineHeight: '1.2',
            color: '#999'
          }}
        >
          {t('git.syncToGit')}
        </Button>
      </Tooltip>
    );
  }

  const getSyncStatusIcon = (status) => {
    switch (status) {
      case 'syncing':
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#999' }} />;
    }
  };

  const getSyncStatusText = (status) => {
    switch (status) {
      case 'syncing':
        return t('git.syncing');
      case 'failed':
        return t('git.failed');
      default:
        return t('git.syncToGit');
    }
  };

  const getSyncStatusTooltip = (status) => {
    if (disabled) return t('records.pleaseSyncOJFirst');
    switch (status) {
      case 'syncing':
        return t('git.syncingInProgress');
      case 'failed':
        return t('git.syncFailed');
      default:
        return t('git.notSynced');
    }
  };

  const isDisabled = disabled || record?.git_sync_status === 'syncing';

  return (
    <Tooltip title={getSyncStatusTooltip(record?.git_sync_status)}>
      <Button
        type="text"
        size="small"
        loading={loading}
        disabled={isDisabled}
        onClick={handleSync}
        icon={getSyncStatusIcon(record?.git_sync_status)}
        style={{
          padding: '4px 8px',
          height: 'auto',
          lineHeight: '1.2',
          color: disabled ? '#999' : undefined
        }}
      >
        {getSyncStatusText(record?.git_sync_status)}
      </Button>
    </Tooltip>
  );
};

export default GitSyncAction;
