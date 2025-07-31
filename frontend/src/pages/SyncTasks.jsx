import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  message,
  Tag,
  Space,
  Row,
  Col,
  Tooltip,
  Modal,
  Form,
  Select,
  Alert,
  Progress,
  Popconfirm,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PlusOutlined,
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  CloudSyncOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatLocalTime } from '../utils';
import { DataTable, StatusIndicator } from '../components/common';
import ResponsiveStatCard from '../components/dashboard/ResponsiveStatCard';
import {
  GradientPageHeader,
  ModernCard,
  GRADIENT_THEMES,
} from '../components/ui/ModernDesignSystem';

import syncTaskService from '../services/syncTaskService';
import recordsService from '../services/recordsService';
import leetcodeService from '../services/leetcodeService';
import { useConfig } from '../contexts/ConfigContext';
import useTableFilters from '../hooks/useTableFilters';

const { Option } = Select;

const SyncTasks = () => {
  const { t } = useTranslation();
  const { hasLeetCodeConfig, hasGitConfig, hasGeminiConfig } = useConfig();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // State management
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [unsyncedRecords, setUnsyncedRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState(null);
  const [leetcodeProfile, setLeetCodeProfile] = useState(null);
  const [leetcodeProfileLoading, setLeetCodeProfileLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();
  const isInitialLoad = useRef(true);

  // Use the new table filters hook
  const { filters, clearAllFilters, createAutoFilterHandler } = useTableFilters(
    (apiFilters) => {
      setPagination((prev) => ({ ...prev, current: 1 }));
      loadTasks(apiFilters); // Always fetch stats when filters change
    },
  );

  const loadTasks = useCallback(
    async (apiFilters = {}) => {
      setLoading(true);
      try {
        // Process filters to ensure proper data types
        const processedFilters = {};
        Object.keys(apiFilters).forEach((key) => {
          const value = apiFilters[key];
          if (
            value !== undefined &&
            value !== null &&
            (value !== '' || typeof value === 'boolean')
          ) {
            if (key === 'id' && value !== '') {
              // Convert id to integer for API compatibility
              const parsedId = parseInt(value, 10);
              if (!isNaN(parsedId)) {
                processedFilters[key] = parsedId;
              }
            } else {
              processedFilters[key] = value;
            }
          }
        });

        const requests = [
          syncTaskService.getTasks({
            ...processedFilters,
            limit: pagination.pageSize,
            offset: (pagination.current - 1) * pagination.pageSize,
          }),
          syncTaskService.getTaskStats(processedFilters),
        ];

        const results = await Promise.all(requests);
        const tasksData = results[0];
        const statsData = results[1];

        setTasks(tasksData.items || tasksData);
        setPagination((prev) => ({
          ...prev,
          total:
            tasksData.total ||
            (tasksData.items ? tasksData.items.length : tasksData.length),
        }));
        setStats(statsData);

        // Clear selection when filters change
        if (Object.keys(apiFilters).length > 0) {
          setSelectedRowKeys([]);
        }
      } catch (error) {
        message.error(
          t('syncTasks.loadTasksFailed', 'Failed to load tasks') +
            ': ' +
            error.message,
        );
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pagination.current, pagination.pageSize, t],
  );

  const loadSelectableRecords = useCallback(
    async (type) => {
      setRecordsLoading(true);
      try {
        let records = [];
        if (type === 'leetcode_detail_sync') {
          records = await recordsService.getRecords({
            oj_sync_status: ['pending', 'failed'],
            limit: 1000,
          });
          records = records.filter(
            (r) =>
              r.oj_sync_status === 'pending' || r.oj_sync_status === 'failed',
          );
        } else if (type === 'github_sync') {
          records = await recordsService.getRecords({
            github_sync_status: ['pending', 'failed'],
            limit: 1000,
          });
          records = records.filter(
            (r) =>
              r.github_sync_status === 'pending' ||
              r.github_sync_status === 'failed',
          );
        } else if (type === 'gemini_sync') {
          records = await recordsService.getRecords({
            ai_sync_status: ['pending', 'failed'],
            limit: 1000,
          });
          records = records.filter(
            (r) =>
              r.ai_sync_status === 'pending' || r.ai_sync_status === 'failed',
          );
        } else {
          records = [];
        }
        setUnsyncedRecords(records);
      } catch (error) {
        message.error(
          t(
            'syncTasks.loadUnsyncedRecordsFailed',
            'Failed to load unsynced records',
          ) +
            ': ' +
            error.message,
        );
      } finally {
        setRecordsLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      loadTasks({});
    }
  }, [loadTasks]);

  useEffect(() => {
    if (modalVisible) {
      setSelectedTaskType(null);
      setUnsyncedRecords([]);
    }
  }, [modalVisible]);

  useEffect(() => {
    if (modalVisible && selectedTaskType === 'leetcode_batch_sync') {
      // Check LeetCode configuration using ConfigContext
      if (hasLeetCodeConfig()) {
        const loadLeetCodeProfile = async () => {
          setLeetCodeProfileLoading(true);
          try {
            const res = await leetcodeService.getLeetCodeProfile();
            setLeetCodeProfile(res);
          } catch (error) {
            message.error(
              t('leetcode.profileError', 'Failed to load LeetCode profile'),
            );
          } finally {
            setLeetCodeProfileLoading(false);
          }
        };
        loadLeetCodeProfile();
      }
    }
  }, [modalVisible, selectedTaskType, t, hasLeetCodeConfig]);

  const handleTaskTypeChange = (value) => {
    setSelectedTaskType(value);

    // Check configuration using ConfigContext
    if (value === 'leetcode_batch_sync' || value === 'leetcode_detail_sync') {
      if (!hasLeetCodeConfig()) {
        message.warning(
          t(
            'leetcode.configRequiredDesc',
            'LeetCode configuration is required',
          ),
        );
        setSelectedTaskType(null);
        form.setFieldsValue({ type: null });
        return;
      }
    }

    if (value === 'github_sync') {
      if (!hasGitConfig()) {
        message.warning(
          t('git.configRequired', 'Git configuration is required'),
        );
        setSelectedTaskType(null);
        form.setFieldsValue({ type: null });
        return;
      }
    }

    if (value === 'gemini_sync') {
      if (!hasGeminiConfig()) {
        message.warning(
          t(
            'syncTasks.geminiConfigRequiredDesc',
            'Gemini configuration is required',
          ),
        );
        setSelectedTaskType(null);
        form.setFieldsValue({ type: null });
        return;
      }
    }

    // Load records if needed
    if (
      value === 'leetcode_detail_sync' ||
      value === 'github_sync' ||
      value === 'gemini_sync'
    ) {
      loadSelectableRecords(value);
    } else {
      setUnsyncedRecords([]);
    }
  };

  const handleCreateTask = async (values) => {
    try {
      // For leetcode_batch_sync, use maximum submissions count
      if (
        values.type === 'leetcode_batch_sync' &&
        leetcodeProfile?.total_submissions
      ) {
        values.total_records = leetcodeProfile.total_submissions;
      }
      if (values.type === 'leetcode_detail_sync') {
        if (
          !Array.isArray(values.record_ids) ||
          values.record_ids.length === 0
        ) {
          message.warning(
            t(
              'syncTasks.selectRecordsPlaceholder',
              'Please select records to sync',
            ),
          );
          return;
        }
      }
      await syncTaskService.createTask(values);
      message.success(t('syncTasks.taskCreated', 'Task created successfully'));
      setModalVisible(false);
      form.resetFields();
      loadTasks({}); // Refresh after creating task
    } catch (error) {
      message.error(
        t('syncTasks.createTaskFailed', 'Failed to create task') +
          ': ' +
          error.message,
      );
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await syncTaskService.deleteTask(taskId);
      message.success(t('syncTasks.taskDeleted', 'Task deleted successfully'));
      loadTasks({}); // Refresh after deleting task
    } catch (error) {
      message.error(
        t('syncTasks.deleteTaskFailed', 'Failed to delete task') +
          ': ' +
          error.message,
      );
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(
        t('syncTasks.selectTasksFirst', 'Please select tasks first'),
      );
      return;
    }

    setBatchLoading(true);
    try {
      await Promise.all(
        selectedRowKeys.map((id) => syncTaskService.deleteTask(id)),
      );
      message.success(
        t('syncTasks.batchDeleteSuccess', 'Batch delete successful'),
      );
      setSelectedRowKeys([]);
      loadTasks({}); // Refresh after batch delete
    } catch (error) {
      message.error(t('syncTasks.batchDeleteError', 'Batch delete failed'));
    } finally {
      setBatchLoading(false);
    }
  };

  const handleSelectionChange = (selectedRowKeys) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const handleRetryTask = async (taskId) => {
    try {
      await syncTaskService.retryTask(taskId);
      message.success(t('syncTasks.taskRetried', 'Task retried successfully'));
      loadTasks({}); // Refresh after retry
    } catch (error) {
      message.error(
        t('syncTasks.retryTaskFailed', 'Failed to retry task') +
          ': ' +
          error.message,
      );
    }
  };

  const handlePauseTask = async (taskId) => {
    try {
      await syncTaskService.pauseTask(taskId);
      message.success(t('syncTasks.taskPaused', 'Task paused successfully'));
      loadTasks({}); // Refresh after pause
    } catch (error) {
      message.error(
        t('syncTasks.pauseTaskFailed', 'Failed to pause task') +
          ': ' +
          error.message,
      );
    }
  };

  const handleResumeTask = async (taskId) => {
    try {
      await syncTaskService.resumeTask(taskId);
      message.success(t('syncTasks.taskResumed', 'Task resumed successfully'));
      loadTasks({}); // Refresh after resume
    } catch (error) {
      message.error(
        t('syncTasks.resumeTaskFailed', 'Failed to resume task') +
          ': ' +
          error.message,
      );
    }
  };

  const getProgressPercent = (task) => {
    if (!task.total_records) return 0;
    return Math.round((task.synced_records / task.total_records) * 100);
  };

  const getProgressStatus = (task) => {
    if (task.status === 'failed') return 'exception';
    if (task.status === 'completed') return 'success';
    if (task.status === 'running') return 'active';
    return 'normal';
  };

  const columns = [
    {
      title: t('syncTasks.taskId'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('syncTasks.taskType'),
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type) => (
        <Tag color="blue">{syncTaskService.getTypeText(type, t)}</Tag>
      ),
    },
    {
      title: t('syncTasks.statusLabel'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <StatusIndicator status={status} type="task" size="small" />
      ),
    },
    {
      title: t('syncTasks.progress'),
      key: 'progress',
      width: 160,
      render: (_, task) => (
        <div>
          <Progress
            percent={getProgressPercent(task)}
            status={getProgressStatus(task)}
            size="small"
            showInfo={false}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            {task.synced_records || 0} / {task.total_records || 0}
          </div>
        </div>
      ),
    },
    {
      title: t('syncTasks.successCount'),
      dataIndex: 'synced_records',
      key: 'synced_records',
      width: 100,
      align: 'center',
      render: (value) => <span style={{ color: '#52c41a' }}>{value || 0}</span>,
    },
    {
      title: t('syncTasks.failedCount'),
      dataIndex: 'failed_records',
      key: 'failed_records',
      width: 100,
      align: 'center',
      render: (value) => <span style={{ color: '#ff4d4f' }}>{value || 0}</span>,
    },
    {
      title: t('syncTasks.recordIds'),
      dataIndex: 'record_ids',
      key: 'record_ids',
      width: 120,
      render: (recordIds) => (
        <Tooltip title={recordIds?.join(', ') || t('syncTasks.allRecords')}>
          <span>
            {recordIds
              ? `${recordIds.length} ${t('syncTasks.records')}`
              : t('syncTasks.all')}
          </span>
        </Tooltip>
      ),
    },
    {
      title: t('syncTasks.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => (
        <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
          {formatLocalTime(date)}
        </span>
      ),
    },
    {
      title: t('syncTasks.actions'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, task) => (
        <Space>
          {syncTaskService.canRetry(task.status) && (
            <Tooltip title={t('syncTasks.retry')}>
              <Button
                icon={<SyncOutlined />}
                size="small"
                onClick={() => handleRetryTask(task.id)}
              >
                {t('syncTasks.retry')}
              </Button>
            </Tooltip>
          )}
          {syncTaskService.canPause(task.status) && (
            <Tooltip title={t('syncTasks.pause')}>
              <Button
                icon={<PauseCircleOutlined />}
                size="small"
                onClick={() => handlePauseTask(task.id)}
              >
                {t('syncTasks.pause')}
              </Button>
            </Tooltip>
          )}
          {syncTaskService.canResume(task.status) && (
            <Tooltip title={t('syncTasks.resume')}>
              <Button
                icon={<PlayCircleOutlined />}
                size="small"
                onClick={() => handleResumeTask(task.id)}
              >
                {t('syncTasks.resume')}
              </Button>
            </Tooltip>
          )}
          <Popconfirm
            title={t('syncTasks.confirmDeleteTask')}
            onConfirm={() => handleDeleteTask(task.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              disabled={task.status === 'running'}
            >
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Filter configuration
  const filterConfig = [
    {
      key: 'id',
      label: t('syncTasks.filter.id'),
      type: 'input',
      placeholder: t('syncTasks.filter.idPlaceholder'),
      value: filters.id,
      onChange: createAutoFilterHandler('id', 500),
    },
    {
      key: 'type',
      label: t('syncTasks.filter.type'),
      type: 'select',
      placeholder: t('syncTasks.filter.typePlaceholder'),
      value: filters.type,
      onChange: createAutoFilterHandler('type'),
      options: [
        { label: t('syncTasks.taskTypes.github_sync'), value: 'github_sync' },
        {
          label: t('syncTasks.taskTypes.leetcode_batch_sync'),
          value: 'leetcode_batch_sync',
        },
        {
          label: t('syncTasks.taskTypes.leetcode_detail_sync'),
          value: 'leetcode_detail_sync',
        },
        { label: t('syncTasks.taskTypes.notion_sync'), value: 'notion_sync' },
        { label: t('syncTasks.taskTypes.ai_analysis'), value: 'ai_analysis' },
        { label: t('syncTasks.taskTypes.gemini_sync'), value: 'gemini_sync' },
      ],
    },
    {
      key: 'status',
      label: t('syncTasks.filter.status'),
      type: 'select',
      placeholder: t('syncTasks.filter.statusPlaceholder'),
      value: filters.status,
      onChange: createAutoFilterHandler('status'),
      options: [
        { label: t('syncTasks.status.pending'), value: 'pending' },
        { label: t('syncTasks.status.running'), value: 'running' },
        { label: t('syncTasks.status.completed'), value: 'completed' },
        { label: t('syncTasks.status.failed'), value: 'failed' },
        { label: t('syncTasks.status.paused'), value: 'paused' },
      ],
    },
    {
      key: 'created_at_range',
      label: t('syncTasks.filter.createdAt'),
      type: 'dateRange',
      value: filters.created_at_range,
      onChange: createAutoFilterHandler('created_at_range'),
    },
  ];

  // Actions configuration
  const actions = [
    {
      text: t('syncTasks.createTask', 'Create Task'),
      type: 'primary',
      icon: <PlusOutlined />,
      onClick: () => setModalVisible(true),
    },
    {
      text: `${t('syncTasks.batchDelete', 'Batch Delete')} (${selectedRowKeys.length})`,
      icon: <DeleteOutlined />,
      onClick: handleBatchDelete,
      loading: batchLoading,
      disabled: selectedRowKeys.length === 0,
      danger: true,
    },
  ];

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: isMobile ? '16px' : '24px',
      }}
    >
      {/* Modern Page Header */}
      <GradientPageHeader
        icon={
          <CloudSyncOutlined
            style={{
              fontSize: isMobile ? '24px' : '36px',
              color: 'white',
            }}
          />
        }
        title={t('syncTasks.title', 'Sync Tasks')}
        subtitle={
          <>
            <BarChartOutlined
              style={{ fontSize: isMobile ? '16px' : '20px' }}
            />
            {t(
              'syncTasks.manageSyncTasks',
              'Manage your synchronization tasks',
            )}
          </>
        }
        isMobile={isMobile}
        gradient={GRADIENT_THEMES.cyan}
      />

      {/* Statistics Section */}
      <ModernCard
        title={t('common.statistics', 'Statistics')}
        icon={<BarChartOutlined />}
        iconGradient={GRADIENT_THEMES.purple}
        isMobile={isMobile}
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <ResponsiveStatCard
              title={t('syncTasks.stats.total', 'Total Tasks')}
              value={stats.total || 0}
              prefix={<SyncOutlined />}
              color="#1890ff"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ResponsiveStatCard
              title={t('syncTasks.stats.running', 'Running Tasks')}
              value={stats.running || 0}
              prefix={<SyncOutlined spin />}
              color="#faad14"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ResponsiveStatCard
              title={t('syncTasks.stats.completed', 'Completed Tasks')}
              value={stats.completed || 0}
              prefix={<CheckCircleOutlined />}
              color="#52c41a"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ResponsiveStatCard
              title={t('syncTasks.stats.failed', 'Failed Tasks')}
              value={stats.failed || 0}
              prefix={<CloseCircleOutlined />}
              color="#ff4d4f"
              loading={loading}
            />
          </Col>
        </Row>
      </ModernCard>

      {/* Sync Tasks List */}
      <ModernCard
        title={t('syncTasks.syncTasksList', 'Sync Tasks List')}
        icon={<CloudSyncOutlined />}
        iconGradient={GRADIENT_THEMES.info}
        isMobile={isMobile}
      >
        <DataTable
          data={tasks}
          columns={columns}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
              // Trigger data reload after pagination changes
              setTimeout(() => {
                loadTasks({});
              }, 0);
            },
          }}
          filters={filterConfig}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={handleSelectionChange}
          onRefresh={() => loadTasks({})}
          onClearFilters={clearAllFilters}
          actions={actions}
          showFilterButtons={false}
        />
      </ModernCard>

      {/* Create Task Modal */}
      <Modal
        title={t('syncTasks.createSyncTask', 'Create Sync Task')}
        open={modalVisible}
        onOk={form.submit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTask}>
          <Form.Item
            label={t('syncTasks.taskType')}
            name="type"
            rules={[
              {
                required: true,
                message: t('syncTasks.selectTaskTypeRequired'),
              },
            ]}
          >
            <Select
              placeholder={t('syncTasks.selectTaskType')}
              onChange={handleTaskTypeChange}
            >
              <Option value="github_sync" disabled={!hasGitConfig}>
                {t('syncTasks.taskTypes.github_sync')}{' '}
                {!hasGitConfig && `(${t('git.configRequired')})`}
              </Option>
              <Option value="leetcode_batch_sync" disabled={!hasLeetCodeConfig}>
                {t('syncTasks.taskTypes.leetcode_batch_sync')}{' '}
                {!hasLeetCodeConfig && `(${t('leetcode.configRequired')})`}
              </Option>
              <Option
                value="leetcode_detail_sync"
                disabled={!hasLeetCodeConfig}
              >
                {t('syncTasks.taskTypes.leetcode_detail_sync')}{' '}
                {!hasLeetCodeConfig && `(${t('leetcode.configRequired')})`}
              </Option>
              <Option value="notion_sync">
                {t('syncTasks.taskTypes.notion_sync')}
              </Option>
              <Option value="ai_analysis">
                {t('syncTasks.taskTypes.ai_analysis')}
              </Option>
            </Select>
          </Form.Item>

          {selectedTaskType === 'leetcode_batch_sync' && (
            <Alert
              message={t('syncTasks.leetcodeBatchSyncInfo')}
              description={
                leetcodeProfileLoading
                  ? t('syncTasks.loadingLeetCodeProfile')
                  : leetcodeProfile &&
                      leetcodeProfile.total_submissions !== undefined
                    ? t('syncTasks.leetcodeTotalSubmissions', {
                        total: leetcodeProfile.total_submissions,
                      })
                    : t('syncTasks.leetcodeTotalSubmissionsUnknown')
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {(selectedTaskType === 'leetcode_detail_sync' ||
            selectedTaskType === 'github_sync' ||
            selectedTaskType === 'gemini_sync') && (
            <Form.Item
              label={t('syncTasks.recordIdsList')}
              name="record_ids"
              rules={[{ required: false }]}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder={t('syncTasks.selectRecordsPlaceholder')}
                loading={recordsLoading}
                optionFilterProp="children"
                showSearch
              >
                {unsyncedRecords.map((record) => (
                  <Option key={record.id} value={record.id}>
                    {record.problem_title
                      ? `${record.problem_title} (#${record.id})`
                      : `#${record.id}`}{' '}
                    ({record.oj_type} - {record.language})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default SyncTasks;
