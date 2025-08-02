import React, { useState } from 'react';
import { Button, Tooltip, message } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import notionService from '../services/notionService';

const NotionSyncAction = ({ record, onSync, disabled = false }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleNotionSync = async () => {
    if (disabled) {
      message.warning(t('records.pleaseSyncOJFirst'));
      return;
    }

    setLoading(true);
    try {
      await notionService.syncRecords({
        record_ids: [record.id],
      });

      message.success(t('notion.syncStarted'));
      if (onSync) {
        onSync();
      }
    } catch (error) {
      message.error(t('notion.syncError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => t('notion.sync');

  const getTooltipText = () => {
    if (disabled) {
      return t('records.pleaseSyncOJFirst');
    }
    return t('notion.syncTooltip');
  };

  const isDisabled = disabled || record.notion_sync_status === 'running';

  return (
    <Tooltip title={getTooltipText()}>
      <Button
        icon={<BookOutlined />}
        size="small"
        onClick={handleNotionSync}
        loading={loading || record.notion_sync_status === 'running'}
        disabled={isDisabled}
        type={record.notion_sync_status === 'failed' ? 'primary' : 'default'}
      >
        {getButtonText()}
      </Button>
    </Tooltip>
  );
};

export default NotionSyncAction;
