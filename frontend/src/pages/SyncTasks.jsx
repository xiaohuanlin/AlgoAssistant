import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  message,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Tooltip,
  Modal,
  Form,
  Select,
  Alert,
  Progress,
  Badge,
  Popconfirm,
  Input,
  DatePicker,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DataTable, StatusIndicator } from '../components/common';
import ResponsiveStatCard from '../components/dashboard/ResponsiveStatCard';

import syncTaskService from '../services/syncTaskService';
import recordsService from '../services/recordsService';
import leetcodeService from '../services/leetcodeService';
import { useConfig } from '../contexts/ConfigContext';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SyncTasks = () => {
  const { t } = useTranslation();
  const { hasLeetCodeConfig, hasGitConfig, hasGeminiConfig } = useConfig();

  // State management
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [unsyncedRecords, setUnsyncedRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState(null);
  const [filters, setFilters] = useState({});
  const [leetcodeProfile, setLeetCodeProfile] = useState(null);
  const [leetcodeProfileLoading, setLeetCodeProfileLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  const loadData = useCallback(async (newFilters = {}) => {
    setLoading(true);
    try {
      const queryFilters = { ...filters, ...newFilters };
      const [tasksData, statsData] = await Promise.all([
        syncTaskService.getTasks({
          ...queryFilters,
          limit: pagination.pageSize,
          offset: (pagination.current - 1) * pagination.pageSize
        }),
        syncTaskService.getTaskStats(),
      ]);
      setTasks(tasksData.items || tasksData);
      setStats(statsData);
      setPagination(prev => ({
        ...prev,
        total: tasksData.total || tasksData.length
      }));
    } catch (error) {
      message.error(t('syncTasks.loadError'));
      console.error('Load sync tasks error:', error);
    } finally {
      setLoading(false);
    }
  }, [t, filters, pagination.current, pagination.pageSize]);

  const loadSelectableRecords = useCallback(async (type) => {
    setRecordsLoading(true);
    try {
      let records = [];
      if (type === 'leetcode_detail_sync') {
        records = await recordsService.getRecords({ oj_sync_status: ['pending', 'failed'], limit: 1000 });
        records = records.filter(r => r.oj_sync_status === 'pending' || r.oj_sync_status === 'failed');
      } else if (type === 'github_sync') {
        records = await recordsService.getRecords({ github_sync_status: ['pending', 'failed'], limit: 1000 });
        records = records.filter(r => r.github_sync_status === 'pending' || r.github_sync_status === 'failed');
      } else if (type === 'gemini_sync') {
        records = await recordsService.getRecords({ ai_sync_status: ['pending', 'failed'], limit: 1000 });
        records = records.filter(r => r.ai_sync_status === 'pending' || r.ai_sync_status === 'failed');
      } else {
        records = [];
      }
      setUnsyncedRecords(records);
    } catch (error) {
      message.error(t('syncTasks.loadUnsyncedRecordsFailed') + ': ' + error.message);
    } finally {
      setRecordsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
    // Set up periodic refresh
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [loadData]);

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
            console.error('Error loading LeetCode profile:', error);
            message.error(t('leetcode.profileError'));
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
        message.warning(t('leetcode.configRequiredDesc'));
        setSelectedTaskType(null);
        form.setFieldsValue({ type: null });
        return;
      }
    }

    if (value === 'github_sync') {
      if (!hasGitConfig()) {
        message.warning(t('git.configRequired'));
        setSelectedTaskType(null);
        form.setFieldsValue({ type: null });
        return;
      }
    }

    if (value === 'gemini_sync') {
      if (!hasGeminiConfig()) {
        message.warning(t('syncTasks.geminiConfigRequiredDesc'));
        setSelectedTaskType(null);
        form.setFieldsValue({ type: null });
        return;
      }
    }

    // Load records if needed
    if (value === 'leetcode_detail_sync' || value === 'github_sync' || value === 'gemini_sync') {
      loadSelectableRecords(value);
    } else {
      setUnsyncedRecords([]);
    }
  };

  const handleCreateTask = async (values) => {
    try {
      // For leetcode_batch_sync, use maximum submissions count
      if (values.type === 'leetcode_batch_sync' && leetcodeProfile?.total_submissions) {
        values.total_records = leetcodeProfile.total_submissions;
      }
      if (values.type === 'leetcode_detail_sync') {
        if (!Array.isArray(values.record_ids) || values.record_ids.length === 0) {
          message.warning(t('syncTasks.selectRecordsPlaceholder'));
          return;
        }
      }
      await syncTaskService.createTask(values);
      message.success(t('syncTasks.taskCreated'));
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(t('syncTasks.createTaskFailed') + ': ' + error.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await syncTaskService.deleteTask(taskId);
      message.success(t('syncTasks.taskDeleted'));
      loadData();
    } catch (error) {
      message.error(t('syncTasks.deleteTaskFailed') + ': ' + error.message);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t('syncTasks.selectTasksFirst'));
      return;
    }

    setBatchLoading(true);
    try {
      await Promise.all(selectedRowKeys.map(id => syncTaskService.deleteTask(id)));
      message.success(t('syncTasks.batchDeleteSuccess'));
      setSelectedRowKeys([]);
      loadData();
    } catch (error) {
      message.error(t('syncTasks.batchDeleteError'));
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
      message.success(t('syncTasks.taskRetried'));
      loadData();
    } catch (error) {
      message.error(t('syncTasks.retryTaskFailed') + ': ' + error.message);
    }
  };

  const handlePauseTask = async (taskId) => {
    try {
      await syncTaskService.pauseTask(taskId);
      message.success(t('syncTasks.taskPaused'));
      loadData();
    } catch (error) {
      message.error(t('syncTasks.pauseTaskFailed') + ': ' + error.message);
    }
  };

  const handleResumeTask = async (taskId) => {
    try {
      await syncTaskService.resumeTask(taskId);
      message.success(t('syncTasks.taskResumed'));
      loadData();
    } catch (error) {
      message.error(t('syncTasks.resumeTaskFailed') + ': ' + error.message);
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
        <Tag color="blue">
          {syncTaskService.getTypeText(type, t)}
        </Tag>
      ),
    },
    {
      title: t('syncTasks.statusLabel'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <StatusIndicator
          status={status}
          type="task"
          size="small"
        />
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
            {recordIds ? `${recordIds.length} ${t('syncTasks.records')}` : t('syncTasks.all')}
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
        <span style={{ fontSize: '12px' }}>
          {new Date(date).toLocaleString()}
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

  const handleFilter = (values) => {
    const newFilters = {};
    Object.keys(values).forEach(key => {
      if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
        if (key === 'created_at_range' && values[key]?.length === 2) {
          newFilters.created_at_start = values[key][0].startOf('day').toISOString();
          newFilters.created_at_end = values[key][1].endOf('day').toISOString();
        } else {
          newFilters[key] = values[key];
        }
      }
    });
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadData(newFilters);
  };

  // Filter configuration
  const filterConfig = [
    {
      key: 'id',
      label: t('syncTasks.filter.id'),
      type: 'input',
      placeholder: t('syncTasks.filter.idPlaceholder'),
      value: filters.id,
      onChange: (value) => setFilters(prev => ({ ...prev, id: value }))
    },
    {
      key: 'type',
      label: t('syncTasks.filter.type'),
      type: 'select',
      placeholder: t('syncTasks.filter.typePlaceholder'),
      value: filters.type,
      onChange: (value) => setFilters(prev => ({ ...prev, type: value })),
      options: [
        { label: t('syncTasks.taskTypes.github_sync'), value: 'github_sync' },
        { label: t('syncTasks.taskTypes.leetcode_batch_sync'), value: 'leetcode_batch_sync' },
        { label: t('syncTasks.taskTypes.leetcode_detail_sync'), value: 'leetcode_detail_sync' },
        { label: t('syncTasks.taskTypes.notion_sync'), value: 'notion_sync' },
        { label: t('syncTasks.taskTypes.ai_analysis'), value: 'ai_analysis' },
        { label: t('syncTasks.taskTypes.gemini_sync'), value: 'gemini_sync' }
      ]
    },
    {
      key: 'status',
      label: t('syncTasks.filter.status'),
      type: 'select',
      placeholder: t('syncTasks.filter.statusPlaceholder'),
      value: filters.status,
      onChange: (value) => setFilters(prev => ({ ...prev, status: value })),
      options: [
        { label: t('syncTasks.status.pending'), value: 'pending' },
        { label: t('syncTasks.status.running'), value: 'running' },
        { label: t('syncTasks.status.completed'), value: 'completed' },
        { label: t('syncTasks.status.failed'), value: 'failed' },
        { label: t('syncTasks.status.paused'), value: 'paused' }
      ]
    },
    {
      key: 'created_at_range',
      label: t('syncTasks.filter.createdAt'),
      type: 'dateRange',
      value: filters.created_at_range,
      onChange: (value) => setFilters(prev => ({ ...prev, created_at_range: value }))
    }
  ];

  // Actions configuration
  const actions = [
    {
      text: t('syncTasks.createTask'),
      type: 'primary',
      icon: <PlusOutlined />,
      onClick: () => setModalVisible(true)
    },
    {
      text: `${t('syncTasks.batchDelete')} (${selectedRowKeys.length})`,
      icon: <DeleteOutlined />,
      onClick: handleBatchDelete,
      loading: batchLoading,
      disabled: selectedRowKeys.length === 0,
      danger: true
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <ResponsiveStatCard
            title={t('syncTasks.stats.total')}
            value={stats.total || 0}
            prefix={<SyncOutlined />}
            color="#1890ff"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ResponsiveStatCard
            title={t('syncTasks.stats.running')}
            value={stats.running || 0}
            prefix={<SyncOutlined spin />}
            color="#faad14"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ResponsiveStatCard
            title={t('syncTasks.stats.completed')}
            value={stats.completed || 0}
            prefix={<CheckCircleOutlined />}
            color="#52c41a"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ResponsiveStatCard
            title={t('syncTasks.stats.failed')}
            value={stats.failed || 0}
            prefix={<CloseCircleOutlined />}
            color="#ff4d4f"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Main Data Table */}
      <DataTable
        title={t('syncTasks.title')}
        subtitle={t('syncTasks.syncTasksList')}
        data={tasks}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize }));
          }
        }}
        filters={filterConfig}
        selectedRowKeys={selectedRowKeys}
        onSelectionChange={handleSelectionChange}
        onRefresh={() => loadData()}
        onFilterChange={handleFilter}
        actions={actions}
      />

      {/* Create Task Modal */}
      <Modal
        title={t('syncTasks.createSyncTask')}
        open={modalVisible}
        onOk={form.submit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTask}
        >
          <Form.Item
            label={t('syncTasks.taskType')}
            name="type"
            rules={[{ required: true, message: t('syncTasks.selectTaskTypeRequired') }]}
          >
            <Select placeholder={t('syncTasks.selectTaskType')} onChange={handleTaskTypeChange}>
              <Option value="github_sync" disabled={!hasGitConfig}>
                {t('syncTasks.taskTypes.github_sync')} {!hasGitConfig && `(${t('git.configRequired')})`}
              </Option>
              <Option value="leetcode_batch_sync" disabled={!hasLeetCodeConfig}>
                {t('syncTasks.taskTypes.leetcode_batch_sync')} {!hasLeetCodeConfig && `(${t('leetcode.configRequired')})`}
              </Option>
              <Option value="leetcode_detail_sync" disabled={!hasLeetCodeConfig}>
                {t('syncTasks.taskTypes.leetcode_detail_sync')} {!hasLeetCodeConfig && `(${t('leetcode.configRequired')})`}
              </Option>
              <Option value="notion_sync">{t('syncTasks.taskTypes.notion_sync')}</Option>
              <Option value="ai_analysis">{t('syncTasks.taskTypes.ai_analysis')}</Option>
            </Select>
          </Form.Item>

          {selectedTaskType === 'leetcode_batch_sync' && (
            <Alert
              message={t('syncTasks.leetcodeBatchSyncInfo')}
              description={
                leetcodeProfileLoading
                  ? t('syncTasks.loadingLeetCodeProfile')
                  : leetcodeProfile && leetcodeProfile.total_submissions !== undefined
                  ? t('syncTasks.leetcodeTotalSubmissions', { total: leetcodeProfile.total_submissions })
                  : t('syncTasks.leetcodeTotalSubmissionsUnknown')
              }
              type="info"
              showIcon
              style={{ marginBottom:16}}
            />
          )}

          {(selectedTaskType === 'leetcode_detail_sync' || selectedTaskType === 'github_sync' || selectedTaskType === 'gemini_sync') && (
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
                {unsyncedRecords.map(record => (
                  <Option key={record.id} value={record.id}>
                    {record.problem_title ? `${record.problem_title} (#${record.id})` : `#${record.id}`} ({record.oj_type} - {record.language})
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
