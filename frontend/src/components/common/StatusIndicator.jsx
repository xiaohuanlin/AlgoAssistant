import React from 'react';
import { Tag } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const StatusIndicator = ({
  status,
  type = 'sync', // sync, execution, review, task, notification
  showIcon = true,
  showText = true,
  size = 'default',
  className = '',
}) => {
  const { t } = useTranslation();

  const getStatusConfig = () => {
    const baseConfigs = {
      // Sync statuses
      pending: {
        color: 'default',
        icon: <ClockCircleOutlined />,
        text:
          type === 'notification'
            ? t('review.status.pending')
            : t('records.statusPending'),
      },
      syncing: {
        color: 'processing',
        icon: <LoadingOutlined />,
        text: t('records.statusSyncing'),
      },
      synced: {
        color: 'success',
        icon: <CheckCircleOutlined />,
        text: t('records.statusSynced'),
      },
      failed: {
        color: 'error',
        icon: <CloseCircleOutlined />,
        text:
          type === 'notification'
            ? t('review.status.failed')
            : t('records.statusFailed'),
      },
      paused: {
        color: 'warning',
        icon: <PauseCircleOutlined />,
        text: t('records.statusPaused'),
      },
      retry: {
        color: 'warning',
        icon: <SyncOutlined />,
        text: t('records.statusRetry'),
      },

      // Execution statuses
      accepted: {
        color: 'success',
        icon: <CheckCircleOutlined />,
        text: t('records.statusAccepted'),
      },
      wrong_answer: {
        color: 'error',
        icon: <CloseCircleOutlined />,
        text: t('records.statusWrongAnswer'),
      },
      time_limit_exceeded: {
        color: 'warning',
        icon: <ClockCircleOutlined />,
        text: t('records.statusTimeLimitExceeded'),
      },
      memory_limit_exceeded: {
        color: 'warning',
        icon: <ExclamationCircleOutlined />,
        text: t('records.statusMemoryLimitExceeded'),
      },
      runtime_error: {
        color: 'error',
        icon: <CloseCircleOutlined />,
        text: t('records.statusRuntimeError'),
      },
      compile_error: {
        color: 'error',
        icon: <CloseCircleOutlined />,
        text: t('records.statusCompileError'),
      },
      other: {
        color: 'default',
        icon: <QuestionCircleOutlined />,
        text: t('common.other'),
      },

      // Review statuses
      due: {
        color: 'warning',
        icon: <ClockCircleOutlined />,
        text: t('review.dueToday'),
      },
      due_today: {
        color: 'warning',
        icon: <ClockCircleOutlined />,
        text: t('review.dueToday'),
      },
      overdue: {
        color: 'error',
        icon: <ExclamationCircleOutlined />,
        text: t('review.overdue'),
      },
      normal: {
        color: 'success',
        icon: <CheckCircleOutlined />,
        text: t('review.normal'),
      },
      completed: {
        color: 'success',
        icon: <CheckCircleOutlined />,
        text: t('review.status.completed'),
      },

      // Notification statuses
      sent: {
        color: 'success',
        icon: <CheckCircleOutlined />,
        text: t('review.status.sent'),
      },

      // Task statuses
      running: {
        color: 'processing',
        icon: <LoadingOutlined />,
        text: t('syncTasks.status.running'),
      },
      queued: {
        color: 'default',
        icon: <ClockCircleOutlined />,
        text: t('syncTasks.status.queued'),
      },
      cancelled: {
        color: 'default',
        icon: <CloseCircleOutlined />,
        text: t('syncTasks.status.cancelled'),
      },
    };

    // Normalize status key
    const normalizedStatus = String(status).toLowerCase().replace(/\s+/g, '_');
    return (
      baseConfigs[normalizedStatus] || {
        color: 'default',
        icon: <QuestionCircleOutlined />,
        text: status || t('common.unknown'),
      }
    );
  };

  const config = getStatusConfig();

  const content = (
    <>
      {showIcon && config.icon}
      {showText && (
        <span style={{ marginLeft: showIcon ? 4 : 0 }}>{config.text}</span>
      )}
    </>
  );

  return (
    <Tag
      color={config.color}
      className={`status-indicator ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: size === 'small' ? '12px' : '14px',
      }}
    >
      {content}
    </Tag>
  );
};

export default StatusIndicator;
