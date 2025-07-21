import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
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
  FilterOutlined,
  ClearOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import syncTaskService from '../services/syncTaskService';
import recordsService from '../services/recordsService';
import leetcodeService from '../services/leetcodeService';
import { useConfig } from '../contexts/ConfigContext';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SyncTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { t } = useTranslation();
  const { hasLeetCodeConfig, hasGitConfig, hasGeminiConfig } = useConfig();
  const [unsyncedRecords, setUnsyncedRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState(null);
  const [filters, setFilters] = useState({});
  const [leetcodeProfile, setLeetCodeProfile] = useState(null);
  const [leetcodeProfileLoading, setLeetCodeProfileLoading] = useState(false);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, statsData] = await Promise.all([
        syncTaskService.getTasks(filters),
        syncTaskService.getTaskStats(),
      ]);
      setTasks(tasksData);
      setStats(statsData);
    } catch (error) {
      message.error(t('syncTasks.loadTaskDataFailed') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [t, filters]);

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
      // 使用ConfigContext检查LeetCode配置
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

    // 使用ConfigContext检查配置
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
      width: 120,
      render: (type) => (
        <Tag color="blue">{syncTaskService.getTypeText(type, t)}</Tag>
      ),
    },
    {
      title: t('syncTasks.statusLabel'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge
          status={syncTaskService.getStatusColor(status)}
          text={syncTaskService.getStatusText(status, t)}
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
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: t('syncTasks.updatedAt'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: t('syncTasks.actions'),
      key: 'actions',
      width: 200,
      render: (_, task) => (
        <Space>
          {syncTaskService.canRetry(task.status) && (
            <Button
              size="small"
              icon={<SyncOutlined />}
              onClick={() => handleRetryTask(task.id)}
            >
              {t('syncTasks.retry')}
            </Button>
          )}
          {syncTaskService.canPause(task.status) && (
            <Button
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handlePauseTask(task.id)}
            >
              {t('syncTasks.pause')}
            </Button>
          )}
          {syncTaskService.canResume(task.status) && (
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleResumeTask(task.id)}
            >
              {t('syncTasks.resume')}
            </Button>
          )}
          <Popconfirm
            title={t('syncTasks.confirmDeleteTask')}
            onConfirm={() => handleDeleteTask(task.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
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

      // Filter form submission
  const handleFilter = (values) => {
    const { created_at_range, ...rest } = values;
    let filterParams = { ...rest };
    if (created_at_range && created_at_range.length === 2) {
      filterParams.created_at_start = created_at_range[0].startOf('day').toISOString();
      filterParams.created_at_end = created_at_range[1].endOf('day').toISOString();
    }
    setFilters(filterParams);
  };
  const handleReset = () => {
    setFilters({});
    form.resetFields();
  };

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('syncTasks.stats.total')}
              value={stats.total || 0}
              prefix={<SyncOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('syncTasks.stats.running')}
              value={stats.running || 0}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('syncTasks.stats.completed')}
              value={stats.completed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('syncTasks.stats.failed')}
              value={stats.failed || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter Bar*/}
      <Card
        size="small"
        style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
        title={
          <Space>
            <FilterOutlined />
            {t('syncTasks.filters')}
          </Space>
        }
        extra={
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={handleReset}
          >
            {t('common.reset')}
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilter}
          initialValues={filters}
        >
          <Row gutter={[16, 0]}>
            <Col span={6} style={{ minWidth: 160 }}>
              <Form.Item name="id" label={t('syncTasks.filter.id')}>
                <Input placeholder={t('syncTasks.filter.idPlaceholder')} allowClear />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 180 }}>
              <Form.Item name="type" label={t('syncTasks.filter.type')}>
                <Select allowClear placeholder={t('syncTasks.filter.typePlaceholder')}>
                  <Option value="github_sync">{t('syncTasks.taskTypes.github_sync')}</Option>
                  <Option value="leetcode_batch_sync">{t('syncTasks.taskTypes.leetcode_batch_sync')}</Option>
                  <Option value="leetcode_detail_sync">{t('syncTasks.taskTypes.leetcode_detail_sync')}</Option>
                  <Option value="notion_sync">{t('syncTasks.taskTypes.notion_sync')}</Option>
                  <Option value="ai_analysis">{t('syncTasks.taskTypes.ai_analysis')}</Option>
                  <Option value="gemini_sync" disabled={!hasGeminiConfig}>
                    {t('syncTasks.taskTypes.gemini_sync')} {!hasGeminiConfig && `(${t('syncTasks.geminiConfigRequired')})`}
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 180 }}>
              <Form.Item name="status" label={t('syncTasks.filter.status')}>
                <Select allowClear placeholder={t('syncTasks.filter.statusPlaceholder')}>
                  <Option value="pending">{t('syncTasks.status.pending')}</Option>
                  <Option value="running">{t('syncTasks.status.running')}</Option>
                  <Option value="completed">{t('syncTasks.status.completed')}</Option>
                  <Option value="failed">{t('syncTasks.status.failed')}</Option>
                  <Option value="paused">{t('syncTasks.status.paused')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 220 }}>
              <Form.Item name="created_at_range" label={t('syncTasks.filter.createdAt')}>
                <RangePicker style={{ width: '100%' }} placeholder={[t('syncTasks.filter.startDate'), t('syncTasks.filter.endDate')]} />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 120, display: 'flex', alignItems: 'flex-end' }}>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  {t('common.search')}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Task List */}
      <Card
        title={t('syncTasks.syncTasks')}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
            >
              {t('common.refresh')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              {t('syncTasks.createTask')}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              t('syncTasks.pagination.showing', { start: range[0], end: range[1], total }),
          }}
        />
      </Card>

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
