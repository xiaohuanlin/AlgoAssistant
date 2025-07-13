import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Modal,
  Form,
  Select,
  Input,
  message,
  Tooltip,
  Popconfirm,
  Progress,
  Badge,
} from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import syncTaskService from '../services/syncTaskService';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

const SyncTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, statsData] = await Promise.all([
        syncTaskService.getTasks(),
        syncTaskService.getTaskStats(),
      ]);
      setTasks(tasksData);
      setStats(statsData);
    } catch (error) {
      message.error(t('syncTasks.loadTaskDataFailed') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
    // Set up periodic refresh
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [loadData]);

  const handleCreateTask = async (values) => {
    try {
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
        <Tag color="blue">{syncTaskService.getTypeText(type)}</Tag>
      ),
    },
    {
      title: t('syncTasks.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge
          status={syncTaskService.getStatusColor(status)}
          text={syncTaskService.getStatusText(status)}
        />
      ),
    },
    {
      title: t('syncTasks.progress'),
      key: 'progress',
      width: 200,
      render: (_, task) => (
        <div>
          <Progress
            percent={getProgressPercent(task)}
            status={getProgressStatus(task)}
            size="small"
            showInfo={false}
          />
          <div style={{ fontSize: '12px', color: '#666' }}>
            {task.synced_records || 0} / {task.total_records || 0}
            {task.failed_records > 0 && (
              <span style={{ color: '#ff4d4f', marginLeft: 8 }}>
                {t('syncTasks.failed')}: {task.failed_records}
              </span>
            )}
          </div>
        </div>
      ),
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
      width: 120,
      render: (_, task) => (
        <Space>
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
              <Select placeholder={t('syncTasks.selectTaskType')}>
                <Option value="github_sync">{t('syncTasks.taskTypes.github_sync')}</Option>
                <Option value="leetcode_batch_sync">{t('syncTasks.taskTypes.leetcode_batch_sync')}</Option>
                <Option value="leetcode_detail_sync">{t('syncTasks.taskTypes.leetcode_detail_sync')}</Option>
                <Option value="notion_sync">{t('syncTasks.taskTypes.notion_sync')}</Option>
                <Option value="ai_analysis">{t('syncTasks.taskTypes.ai_analysis')}</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={t('syncTasks.recordIdsList')}
              name="record_ids"
              extra={t('syncTasks.recordIdsHelp')}
            >
              <Input placeholder={t('syncTasks.recordIdsPlaceholder')} />
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SyncTasks;
