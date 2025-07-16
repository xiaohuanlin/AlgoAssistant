import React, { useState } from 'react';
import { Button, message, Tooltip } from 'antd';
import { RobotOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const GeminiSyncAction = ({ record, onSync, geminiConfig, disabled }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const geminiConfigured = !!(geminiConfig && geminiConfig.api_key);

  const handleSync = async () => {
    if (disabled) return;
    if (!record || !record.id) {
      message.error(t('gemini.invalidRecord'));
      return;
    }

    if (!geminiConfigured) {
      message.error(t('gemini.configRequired'));
      return;
    }

    setLoading(true);
    try {
      // 调用 Gemini 同步服务
      const geminiSyncService = require('../services/geminiSyncService').default;
      await geminiSyncService.syncToGemini([record.id]);
      message.success(t('gemini.syncStarted'));
      onSync && onSync();
    } catch (error) {
      message.error(t('gemini.syncError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 如果已经同步，显示成功状态
  if (record?.ai_sync_status === 'synced') {
    return (
      <Tooltip title={t('gemini.alreadySynced')}>
        <Button
          type="text"
          size="small"
          disabled
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          style={{
            padding: '4px 8px',
            height: 'auto',
            lineHeight: '1.2',
            color: '#52c41a'
          }}
        >
          {t('gemini.synced')}
        </Button>
      </Tooltip>
    );
  }

  // 如果 Gemini 未配置，显示灰色按钮
  if (!geminiConfigured) {
    return (
      <Tooltip title={t('gemini.configRequired')}>
        <Button
          type="text"
          size="small"
          disabled
          icon={<RobotOutlined />}
          style={{
            padding: '4px 8px',
            height: 'auto',
            lineHeight: '1.2',
            color: '#999'
          }}
        >
          {t('gemini.aiSync')}
        </Button>
      </Tooltip>
    );
  }

  const getSyncStatusIcon = (status) => {
    switch (status) {
      case 'syncing':
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      // failed 状态下也显示默认icon
      default:
        return <ClockCircleOutlined style={{ color: '#999' }} />;
    }
  };

  const getSyncStatusText = (status) => {
    switch (status) {
      case 'syncing':
        return t('gemini.syncing');
      // failed 状态下也显示“AI分析”
      default:
        return t('gemini.aiSync');
    }
  };

  const getSyncStatusTooltip = (status) => {
    if (disabled) return t('records.pleaseSyncOJFirst');
    switch (status) {
      case 'syncing':
        return t('gemini.syncingInProgress');
      // failed 状态下也显示“未分析”
      default:
        return t('gemini.notSynced');
    }
  };

  // failed 状态下按钮可点击
  const isDisabled = disabled || record?.ai_sync_status === 'syncing';

  return (
    <Tooltip title={getSyncStatusTooltip(record?.ai_sync_status)}>
      <Button
        type="text"
        size="small"
        loading={loading}
        disabled={isDisabled}
        onClick={handleSync}
        icon={getSyncStatusIcon(record?.ai_sync_status)}
        style={{
          padding: '4px 8px',
          height: 'auto',
          lineHeight: '1.2',
          color: disabled ? '#999' : undefined
        }}
      >
        {getSyncStatusText(record?.ai_sync_status)}
      </Button>
    </Tooltip>
  );
};

export default GeminiSyncAction;
