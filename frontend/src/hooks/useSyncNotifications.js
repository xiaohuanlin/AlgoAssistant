import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

export const useSyncNotifications = () => {
  const { t } = useTranslation();
  const [api, contextHolder] = notification.useNotification();

  const showSyncStart = (count) => {
    api.info({
      message: t('git.syncStarted'),
      description: t('git.syncingRecords', { count }),
      duration: 3,
    });
  };

  const showSyncProgress = (current, total) => {
    api.info({
      message: t('git.syncProgress'),
      description: t('git.syncedRecords', { current, total }),
      duration: 2,
    });
  };

  const showSyncComplete = (success, failed) => {
    api.success({
      message: t('git.syncCompleted'),
      description: t('git.syncSummary', { success, failed }),
      duration: 5,
    });
  };

  const showSyncError = (error) => {
    api.error({
      message: t('git.syncError'),
      description: error.message || t('git.unknownError'),
      duration: 5,
    });
  };



  const showBatchSyncStart = (count) => {
    api.info({
      message: t('git.batchSyncStarted', { count }),
      description: t('git.batchSyncInProgress'),
      duration: 3,
    });
  };

  const showConnectionSuccess = () => {
    api.success({
      message: t('git.connectionSuccess'),
      description: t('git.connectionTestPassed'),
      duration: 3,
    });
  };

  const showConnectionError = (error) => {
    api.error({
      message: t('git.connectionError'),
      description: error.message || t('git.connectionTestFailed'),
      duration: 5,
    });
  };

  return {
    contextHolder,
    showSyncStart,
    showSyncProgress,
    showSyncComplete,
    showSyncError,
    showBatchSyncStart,
    showConnectionSuccess,
    showConnectionError,
  };
};
