import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Button, message, Spin, Table, Tag, Space, DatePicker, Select, Form } from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import gitSyncService from '../services/gitSyncService';
import authService from '../services/authService';

const { RangePicker } = DatePicker;
const { Option } = Select;

const GitSyncStatusPage = () => {
  const { t } = useTranslation();
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [taskList, setTaskList] = useState([]);
  const [filterForm] = Form.useForm();
  const [filters, setFilters] = useState({});

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

  const fetchTaskList = useCallback(async (params = {}) => {
    try {
      const tasks = await gitSyncService.getSyncTasks(params);
      setTaskList(tasks || []);
    } catch (error) {
      message.error(t('git.statusError') + ': ' + error.message);
    }
  }, [t]);

  const handleFilter = (values) => {
    const params = { ...values };
    if (params.timeRange) {
      params.start_time = params.timeRange[0]?.startOf('day').toISOString();
      params.end_time = params.timeRange[1]?.endOf('day').toISOString();
      delete params.timeRange;
    }
    setFilters(params);
    fetchTaskList(params);
  };

  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchSyncStatus();
      fetchTaskList(filters);
    }
  }, [fetchSyncStatus, fetchTaskList, filters]);

  const handleTaskAction = async (action, taskId) => {
    setActionLoading(true);
    try {
      if (action === 'stop') {
        await gitSyncService.stopSync(taskId);
        message.success(t('git.syncStopped'));
      } else if (action === 'resume') {
        await gitSyncService.resumeSync(taskId);
        message.success(t('git.syncResumed'));
      } else if (action === 'retry') {
        await gitSyncService.retryFailedRecords(taskId);
        message.success(t('git.retryStarted'));
      }
      fetchTaskList();
    } catch (error) {
      message.error(t('git.statusError') + ': ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const taskColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: t('git.syncStatus'), dataIndex: 'status', key: 'status', width: 100, render: (status) => {
      const colorMap = {
        'running': 'processing',
        'paused': 'default',
        'completed': 'success',
        'failed': 'error',
      };
      const textMap = {
        'running': t('git.syncing'),
        'paused': t('git.paused'),
        'completed': t('git.synced'),
        'failed': t('git.failed'),
      };
      return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
    } },
    { title: t('git.totalRecords'), dataIndex: 'total_records', key: 'total_records', width: 80 },
    { title: t('git.syncedRecords'), dataIndex: 'synced_records', key: 'synced_records', width: 80 },
    { title: t('git.failedRecords'), dataIndex: 'failed_records', key: 'failed_records', width: 80 },
    { title: t('git.syncTime'), dataIndex: 'created_at', key: 'created_at', width: 160, render: (time) => time ? new Date(time).toLocaleString() : '-' },
    { title: t('records.actions'), key: 'actions', width: 200, render: (_, task) => (
      <Space>
        <Button
          icon={<CloseCircleOutlined />}
          disabled={task.status !== 'running'}
          loading={actionLoading}
          onClick={() => handleTaskAction('stop', task.id)}
        >{t('git.stopSync')}</Button>
        <Button
          icon={<PlayCircleOutlined />}
          disabled={task.status !== 'paused'}
          loading={actionLoading}
          onClick={() => handleTaskAction('resume', task.id)}
        >{t('git.resumeSync')}</Button>
        <Button
          icon={<RedoOutlined />}
          disabled={task.status !== 'failed'}
          loading={actionLoading}
          onClick={() => handleTaskAction('retry', task.id)}
        >{t('git.retryFailed')}</Button>
      </Space>
    ) },
  ];

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
