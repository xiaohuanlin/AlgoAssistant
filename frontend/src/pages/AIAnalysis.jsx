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
  message,
  Tooltip,
  Popconfirm,
  Progress,
  Badge,
  Typography,
  Divider,
} from 'antd';
import {
  RobotOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  FileTextOutlined,
  BulbOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import syncTaskService from '../services/syncTaskService';
import recordsService from '../services/recordsService';

const { Title, Text } = Typography;
const { Option } = Select;

const AIAnalysis = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, recordsData] = await Promise.all([
        syncTaskService.getTasks({ type: 'ai_analysis', limit: 100 }),
        recordsService.getRecords({ limit: 1000 }),
      ]);
      setTasks(tasksData);
      setRecords(recordsData);
    } catch (error) {
      message.error(t('aiAnalysis.loadDataFailed') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
    // Set up auto-refresh
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [loadData]);

  const handleCreateTask = async (values) => {
    try {
      await syncTaskService.createTask({
        type: 'ai_analysis',
        record_ids: values.record_ids,
      });
      message.success(t('aiAnalysis.taskCreated'));
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(t('aiAnalysis.createTaskFailed') + ': ' + error.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await syncTaskService.deleteTask(taskId);
      message.success(t('aiAnalysis.taskDeleted'));
      loadData();
    } catch (error) {
      message.error(t('aiAnalysis.deleteTaskFailed') + ': ' + error.message);
    }
  };

  const handleViewDetail = (task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
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

  const getAnalysisStatusText = (status) => {
    const statusMap = {
      'pending': t('aiAnalysis.pending'),
      'running': t('aiAnalysis.running'),
      'completed': t('aiAnalysis.completed'),
      'failed': t('aiAnalysis.failed'),
      'paused': t('aiAnalysis.paused'),
    };
    return statusMap[status] || status;
  };

  const getAnalysisStatusColor = (status) => {
    const colorMap = {
      'pending': 'default',
      'running': 'processing',
      'completed': 'success',
      'failed': 'error',
      'paused': 'warning',
    };
    return colorMap[status] || 'default';
  };

  const columns = [
    {
      title: t('aiAnalysis.taskId'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('aiAnalysis.taskType'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color="purple" icon={<RobotOutlined />}>
          {t('aiAnalysis.title')}
        </Tag>
      ),
    },
    {
      title: t('aiAnalysis.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge
          status={getAnalysisStatusColor(status)}
          text={getAnalysisStatusText(status)}
        />
      ),
    },
    {
      title: t('aiAnalysis.progress'),
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
                {t('common.failed')}: {task.failed_records}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t('aiAnalysis.recordCount'),
      dataIndex: 'record_ids',
      key: 'record_ids',
      width: 120,
      render: (recordIds) => (
        <Tooltip title={recordIds?.join(', ') || t('common.all')}>
          <span>
            {recordIds ? `${recordIds.length} ${t('common.items')}` : t('common.all')}
          </span>
        </Tooltip>
      ),
    },
    {
      title: t('aiAnalysis.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: t('aiAnalysis.updatedAt'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: t('aiAnalysis.actions'),
      key: 'actions',
      width: 150,
      render: (_, task) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(task)}
          >
            {t('aiAnalysis.viewDetail')}
          </Button>
          <Popconfirm
            title={t('aiAnalysis.confirmDelete')}
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
              {t('aiAnalysis.deleteTask')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Record columns showing only backend schema fields
  const recordColumns = [
    {
      title: t('records.problem'),
      dataIndex: 'problem_title',
      key: 'problem_title',
      render: (title, record) => (
        <div>
          <div>{title}</div>
          <small style={{ color: '#666' }}>
            {record.oj_type} - {record.language}
          </small>
        </div>
      ),
    },
    {
      title: t('records.ojType'),
      dataIndex: 'oj_type',
      key: 'oj_type',
      width: 80,
      render: (ojType) => (
        <Tag color="blue">{ojType}</Tag>
      ),
    },
    {
      title: t('records.language'),
      dataIndex: 'language',
      key: 'language',
      width: 80,
      render: (language) => (
        <Tag color="default">{language}</Tag>
      ),
    },
    {
      title: t('records.aiSyncStatus'),
      dataIndex: 'ai_sync_status',
      key: 'ai_sync_status',
      width: 100,
      render: (status) => {
        if (!status) return <Tag color="default">{t('aiAnalysis.notAnalyzed')}</Tag>;
        return (
          <Tag color={getAnalysisStatusColor(status)}>
            {getAnalysisStatusText(status)}
          </Tag>
        );
      },
    },
  ];

  const aiAnalysisStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    paused: tasks.filter(t => t.status === 'paused').length,
  };

  const analyzedRecords = records.filter(r => r.ai_sync_status);
  const unanalyzedRecords = records.filter(r => !r.ai_sync_status);

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('aiAnalysis.totalTasks')}
              value={aiAnalysisStats.total}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('aiAnalysis.running')}
              value={aiAnalysisStats.running}
              valueStyle={{ color: '#1890ff' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('aiAnalysis.completed')}
              value={aiAnalysisStats.completed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('aiAnalysis.failed')}
              value={aiAnalysisStats.failed}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title={t('aiAnalysis.analyzedRecords')}
              value={analyzedRecords.length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title={t('aiAnalysis.unanalyzedRecords')}
              value={unanalyzedRecords.length}
              valueStyle={{ color: '#faad14' }}
              prefix={<BulbOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            {t('aiAnalysis.createTask')}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
          >
            {t('common.refresh')}
          </Button>
        </Space>
      </div>

      <Card title={t('aiAnalysis.taskList')} loading={loading}>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${t('common.items')} ${range[0]}-${range[1]} / ${total}`,
          }}
        />
      </Card>

      <Modal
        title={t('aiAnalysis.createTask')}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTask}
        >
          <Form.Item
            label={t('aiAnalysis.selectRecords')}
            name="record_ids"
            rules={[
              {
                required: true,
                message: t('aiAnalysis.selectRecordsRequired'),
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={t('aiAnalysis.selectRecordsPlaceholder')}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              style={{ width: '100%' }}
            >
              {records.map((record) => (
                <Option key={record.id} value={record.id}>
                  {record.problem_title} ({record.oj_type} - {record.language})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {t('aiAnalysis.createTask')}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('aiAnalysis.taskDetail')}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTask && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>{t('aiAnalysis.taskId')}：</Text>
                <Text>{selectedTask.id}</Text>
              </Col>
              <Col span={12}>
                <Text strong>{t('aiAnalysis.status')}：</Text>
                <Badge
                  status={getAnalysisStatusColor(selectedTask.status)}
                  text={getAnalysisStatusText(selectedTask.status)}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>{t('aiAnalysis.createdAt')}：</Text>
                <Text>{new Date(selectedTask.created_at).toLocaleString()}</Text>
              </Col>
              <Col span={12}>
                <Text strong>{t('aiAnalysis.updatedAt')}：</Text>
                <Text>{new Date(selectedTask.updated_at).toLocaleString()}</Text>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>{t('aiAnalysis.totalRecords')}：</Text>
                <Text>{selectedTask.total_records || 0}</Text>
              </Col>
              <Col span={12}>
                <Text strong>{t('aiAnalysis.analyzed')}：</Text>
                <Text>{selectedTask.synced_records || 0}</Text>
              </Col>
            </Row>
            {selectedTask.failed_records > 0 && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Text strong style={{ color: '#ff4d4f' }}>{t('aiAnalysis.failedRecords')}：</Text>
                  <Text style={{ color: '#ff4d4f' }}>{selectedTask.failed_records}</Text>
                </Col>
              </Row>
            )}

            <Divider />

            <Title level={4}>{t('aiAnalysis.progress')}</Title>
            <Progress
              percent={getProgressPercent(selectedTask)}
              status={getProgressStatus(selectedTask)}
              style={{ marginBottom: 16 }}
            />

            {selectedTask.record_ids && selectedTask.record_ids.length > 0 && (
              <>
                <Divider />
                <Title level={4}>{t('aiAnalysis.relatedRecords')}</Title>
                <Table
                  columns={recordColumns}
                  dataSource={records.filter(r => selectedTask.record_ids.includes(r.id))}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AIAnalysis;
