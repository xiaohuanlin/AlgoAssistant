import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, message, Spin } from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import gitSyncService from '../services/gitSyncService';
import authService from '../services/authService';

const GitSyncStatusPage = () => {
  const { t } = useTranslation();
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSyncStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [statusResponse] = await Promise.all([
        gitSyncService.getSyncStatus(),
      ]);
      setSyncStatus(statusResponse);
    } catch (error) {
      message.error(t('git.statusError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchTaskList = useCallback(async () => {
    try {
      await gitSyncService.getSyncTasks();
    } catch (error) {
      message.error(t('git.statusError') + ': ' + error.message);
    }
  }, [t]);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchSyncStatus();
      fetchTaskList();
    }
  }, [fetchSyncStatus, fetchTaskList]);

  return (
    <div>
      <Card title={t('git.syncStatusTitle')}>
        <Spin spinning={loading}>
          {syncStatus ? (
            <>
              {/* Statistics */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={t('git.totalRecords')}
                    value={syncStatus.total_records || 0}
                    prefix={<SyncOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={t('git.syncedRecords')}
                    value={syncStatus.synced_count || 0}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={t('git.syncingRecords')}
                    value={syncStatus.syncing_count || 0}
                    prefix={<SyncOutlined spin style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={t('git.failedRecords')}
                    value={syncStatus.failed_count || 0}
                    prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
              </Row>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>{t('git.noStatusData')}</p>
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default GitSyncStatusPage;
