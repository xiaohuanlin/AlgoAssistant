import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  message,
  Spin,
  Tag,
  Typography,
  Space,
  Row,
  Col,
  Statistic,
  Tooltip,
  Tabs,
  Select,
  Alert,
  Form,
  Input,
  DatePicker,
} from 'antd';
import {
  BookOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  FilterOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import recordsService from '../services/recordsService';
import gitSyncService from '../services/gitSyncService';
import GitSyncAction from '../components/GitSyncAction';
import GeminiSyncAction from '../components/GeminiSyncAction';
import configService from '../services/configService';
import { useNavigate } from 'react-router-dom';

import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text, Link } = Typography;

const Records = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});

  // Batch sync states
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [syncOrder, setSyncOrder] = useState('asc');
  const [batchSyncLoading, setBatchSyncLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);
  const [geminiConfig, setGeminiConfig] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({});
  const [filterForm] = Form.useForm();

  const loadRecords = useCallback(async (filterParams = {}) => {
    setLoading(true);
    try {
      const [recordsData, statsData] = await Promise.all([
        recordsService.getRecords(filterParams),
        recordsService.getStats()
      ]);

      // Ensure we have valid arrays/objects
      const validRecords = Array.isArray(recordsData) ? recordsData : [];
      const validStats = statsData && typeof statsData === 'object' ? statsData : {};

      setRecords(validRecords);
      setStats(validStats);
    } catch (error) {
      console.error('Error loading records:', error);

      if (error.response?.status === 401) {
        message.error('Authentication required. Please login again.');
        // Redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        message.error(t('records.loadError'));
      }

      setRecords([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // Add error boundary for debugging
    const handleError = (error) => {
      console.error('Global error caught:', error);
      console.error('Error stack:', error.stack);
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Combine all initialization requests into one useEffect
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const [recordsData, statsData, configData, geminiCfg] = await Promise.all([
          recordsService.getRecords(filters),
          recordsService.getStats(),
          gitSyncService.getConfigurationStatus().catch(err => ({
            configured: false,
            message: 'GitHub not configured',
            action: 'configure',
            actionText: 'Configure GitHub'
          })),
          configService.getGeminiConfig().catch(() => null)
        ]);
        const validRecords = Array.isArray(recordsData) ? recordsData : [];
        const validStats = statsData && typeof statsData === 'object' ? statsData : {};
        setRecords(validRecords);
        setStats(validStats);
        setConfigStatus(configData);
        setGeminiConfig(geminiCfg);
      } catch (error) {
        console.error('Error initializing data:', error);
        if (error.response?.status === 401) {
          message.error('Authentication required. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else {
          message.error(t('records.loadError'));
        }
        setRecords([]);
        setStats({});
        setGeminiConfig(null);
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [filters, t]);

  const handleFilter = (values) => {
    const filterParams = { ...values };

    // Handle date range
    if (values.timeRange && values.timeRange.length === 2) {
      filterParams.start_time = values.timeRange[0].startOf('day').toISOString();
      filterParams.end_time = values.timeRange[1].endOf('day').toISOString();
      delete filterParams.timeRange;
    }

    // Handle tags (convert array to comma-separated string)
    if (values.tags && Array.isArray(values.tags)) {
      filterParams.tags = values.tags.join(',');
    }

    setFilters(filterParams);
  };

  const handleClearFilters = () => {
    filterForm.resetFields();
    setFilters({});
  };



  const handleBatchSync = async () => {
    if (selectedRecords.length === 0) {
      message.warning(t('git.selectRecordsFirst'));
      return;
    }

    // Check if Git is configured
    if (!configStatus?.configured) {
      message.warning(t('git.configRequired'));
      return;
    }

    setBatchSyncLoading(true);
    try {
      await gitSyncService.syncToGit(selectedRecords, { order: syncOrder });
      message.success(t('git.batchSyncStarted', { count: selectedRecords.length }));
      setSelectedRecords([]);
      // Trigger data reload
      setFilters(prev => ({ ...prev }));
    } catch (error) {
      if (error.message.includes('Git configuration not found')) {
        message.warning(t('git.configRequired'));
      } else {
        message.error(t('git.batchSyncError') + ': ' + error.message);
      }
    } finally {
      setBatchSyncLoading(false);
    }
  };

  const navigate = useNavigate();

  const canViewRecord = (record) => {
    if (!record) return false;
    const ojStatus = record.oj_sync_status?.toLowerCase();
    return ojStatus === 'completed';
  };

  const handleViewRecord = (record) => {
    if (!record) {
      message.error('Invalid record');
      return;
    }

    if (!canViewRecord(record)) {
      message.warning(t('records.viewNotAllowed'));
      return;
    }

    navigate(`/records/${record.id}`);
  };

  const handleOJSync = async (record) => {
    if (!record || !record.id) {
      message.error(t('invalidRecord'));
      return;
    }
    try {
      const syncService = require('../services/gitSyncService').default;
      await syncService.createSyncTask({
        type: 'leetcode_detail_sync',
        record_ids: [record.id]
      });
      message.success(t('records.syncTaskCreated'));
      loadRecords();
    } catch (error) {
      message.error(t('records.syncTaskCreateFailed') + ': ' + (error.message || error));
    }
  };


  const getStatusColor = (execution_result) => {
    if (!execution_result || typeof execution_result !== 'string') return 'default';
    switch (execution_result.toLowerCase()) {
      case 'accepted':
        return 'success';
      case 'wrong answer':
        return 'error';
      case 'time limit exceeded':
        return 'warning';
      case 'runtime error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLanguageColor = (language) => {
    if (!language || typeof language !== 'string') return 'default';
    const lowerLanguage = language.toLowerCase();
    const colors = {
      'python': 'blue',
      'java': 'orange',
      'cpp': 'purple',
      'c': 'cyan',
      'javascript': 'yellow',
      'typescript': 'blue',
      'go': 'green',
      'rust': 'red'
    };
    return colors[lowerLanguage] || 'default';
  };

  const isSyncActionEnabled = (record) => {
    const status = (record.oj_sync_status || '').toLowerCase();
    return status === 'completed';
  };

  const columns = [
    {
      title: t('records.problemNumber'),
      dataIndex: 'problem_number',
      key: 'problem_number',
      width: 80,
      render: (problemNumber) => problemNumber ? <Text strong>{problemNumber}</Text> : <Text type="secondary">-</Text>
    },
    {
      title: t('records.problem'),
      key: 'problem_title',
      width: 300,
      render: (_, record) => (
        <Tooltip title={t('records.openInLeetCode')}>
          <Link
            href={record.submission_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1890ff' }}
          >
            <Text strong style={{ fontSize: '14px' }}>
              {record.problem_title || `#${record.id}`}
            </Text>
          </Link>
        </Tooltip>
      )
    },
    {
      title: t('records.status'),
      dataIndex: 'execution_result',
      key: 'execution_result',
      width: 120,
      render: (execution_result) => {
        const safeStatus = execution_result && typeof execution_result === 'string' ? execution_result : '';
        const lowerStatus = safeStatus.toLowerCase();
        return (
          <Tag
            color={getStatusColor(safeStatus)}
            icon={lowerStatus === 'accepted' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          >
            {safeStatus || 'Unknown'}
          </Tag>
        );
      }
    },
    {
      title: t('records.language'),
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: (language) => {
        const safeLanguage = language && typeof language === 'string' ? language : '';
        return (
          <Tag color={getLanguageColor(safeLanguage)}>
            {safeLanguage || 'Unknown'}
          </Tag>
        );
      }
    },
    {
      title: t('records.ojType'),
      dataIndex: 'oj_type',
      key: 'oj_type',
      width: 80,
      render: (ojType) => {
        const safeOjType = ojType && typeof ojType === 'string' ? ojType : 'leetcode';
        return (
          <Tag color="blue">
            {safeOjType}
          </Tag>
        );
      }
    },
    {
      title: t('records.ojSyncStatus'),
      dataIndex: 'oj_sync_status',
      key: 'oj_sync_status',
      width: 100,
      render: (oj_sync_status) => {
        const safeSyncStatus = oj_sync_status && typeof oj_sync_status === 'string' ? oj_sync_status : 'pending';
        const colorMap = {
          'synced': 'success',
          'syncing': 'processing',
          'failed': 'error',
          'pending': 'default',
          'paused': 'default',
          'retry': 'default'
        };
        const textMap = {
          'pending': t('records.gitSyncStatusPending'),
          'syncing': t('records.gitSyncStatusSyncing'),
          'synced': t('records.gitSyncStatusSynced'),
          'failed': t('records.gitSyncStatusFailed'),
          'paused': t('records.gitSyncStatusPaused'),
          'retry': t('records.gitSyncStatusRetry')
        };
        return (
          <Tag color={colorMap[safeSyncStatus] || 'default'}>
            {textMap[safeSyncStatus] || safeSyncStatus}
          </Tag>
        );
      }
    },
    {
      title: t('records.githubSyncStatus'),
      dataIndex: 'github_sync_status',
      key: 'github_sync_status',
      width: 120,
      render: (githubSyncStatus) => {
        const safeGitSyncStatus = githubSyncStatus && typeof githubSyncStatus === 'string' ? githubSyncStatus : 'pending';
        const colorMap = {
          'synced': 'success',
          'syncing': 'processing',
          'failed': 'error',
          'pending': 'default',
          'paused': 'default',
          'retry': 'default'
        };
        const textMap = {
          'pending': t('records.gitSyncStatusPending'),
          'syncing': t('records.gitSyncStatusSyncing'),
          'synced': t('records.gitSyncStatusSynced'),
          'failed': t('records.gitSyncStatusFailed'),
          'paused': t('records.gitSyncStatusPaused'),
          'retry': t('records.gitSyncStatusRetry')
        };
        return (
          <Tag color={colorMap[safeGitSyncStatus] || 'default'}>
            {textMap[safeGitSyncStatus] || safeGitSyncStatus}
          </Tag>
        );
      }
    },
    {
      title: t('records.aiSyncStatus'),
      dataIndex: 'ai_sync_status',
      key: 'ai_sync_status',
      width: 120,
      render: (aiSyncStatus) => {
        const safeAiSyncStatus = aiSyncStatus && typeof aiSyncStatus === 'string' ? aiSyncStatus : 'pending';
        const colorMap = {
          'synced': 'success',
          'syncing': 'processing',
          'failed': 'error',
          'pending': 'default',
          'paused': 'default',
          'retry': 'default'
        };
        const textMap = {
          'pending': t('records.gitSyncStatusPending'),
          'syncing': t('records.gitSyncStatusSyncing'),
          'synced': t('records.gitSyncStatusSynced'),
          'failed': t('records.gitSyncStatusFailed'),
          'paused': t('records.gitSyncStatusPaused'),
          'retry': t('records.gitSyncStatusRetry')
        };
        return (
          <Tag color={colorMap[safeAiSyncStatus] || 'default'}>
            {textMap[safeAiSyncStatus] || safeAiSyncStatus}
          </Tag>
        );
      }
    },
    {
      title: t('records.topicTags'),
      dataIndex: 'topic_tags',
      key: 'topic_tags',
      width: 150,
      render: (topicTags) => {
        if (topicTags && Array.isArray(topicTags) && topicTags.length > 0) {
          return (
            <div>
              {topicTags.slice(0, 2).map((tag, index) => (
                <Tag key={index} color="blue" style={{ marginBottom: 2, fontSize: '10px' }}>
                  {tag}
                </Tag>
              ))}
              {topicTags.length > 2 && (
                <Tag color="default" style={{ fontSize: '10px' }}>
                  +{topicTags.length - 2}
                </Tag>
              )}
            </div>
          );
        }
        return <Text type="secondary">-</Text>;
      }
    },
    {
      title: t('records.submitTime'),
      dataIndex: 'submit_time',
      key: 'submit_time',
      width: 150,
      render: (time) => {
        try {
          if (!time) return <Text type="secondary">-</Text>;
          const dayjsTime = dayjs(time);
          if (!dayjsTime.isValid()) return <Text type="secondary">-</Text>;
          return <Text type="secondary">{dayjsTime.format('YYYY-MM-DD HH:mm')}</Text>;
        } catch (error) {
          console.error('Error rendering submit_time:', error, time);
          return <Text type="secondary">-</Text>;
        }
      },
      sorter: (a, b) => {
        const timeA = a.submit_time ? new Date(a.submit_time) : new Date(0);
        const timeB = b.submit_time ? new Date(b.submit_time) : new Date(0);
        return timeA - timeB;
      },
      defaultSortOrder: 'descend'
    },
    {
      title: t('records.gitFilePath'),
      dataIndex: 'git_file_path',
      key: 'git_file_path',
      width: 180,
      render: (val) => {
        if (!val) return <Text type="secondary">-</Text>;

        if (val.startsWith('http://') || val.startsWith('https://')) {
          return (
            <Link href={val} target="_blank" rel="noopener noreferrer">
              {t('records.viewInGit')}
            </Link>
          );
        }

        return <Text copyable>{val}</Text>;
      }
    },
    {
      title: t('records.notionUrl'),
      dataIndex: 'notion_url',
      key: 'notion_url',
      width: 180,
      render: (val) => val ? <Link href={val} target="_blank" rel="noopener noreferrer">{t('records.viewInNotion')}</Link> : <Text type="secondary">-</Text>
    },
    {
      title: t('records.actions'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const actionEnabled = isSyncActionEnabled(record);
        return (
          <Space>
            <Tooltip title={actionEnabled ? t('records.view') : t('records.pleaseSyncOJFirst')}>
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handleViewRecord(record)}
                disabled={!actionEnabled}
              >
                {t('records.view')}
              </Button>
            </Tooltip>
            <Tooltip title={t('records.syncToOJ')}>
              <Button
                icon={<SyncOutlined />}
                size="small"
                onClick={() => handleOJSync(record)}
              >
                {t('records.syncToOJ')}
              </Button>
            </Tooltip>
            <GitSyncAction record={record} onSync={() => loadRecords()} disabled={!actionEnabled} />
            <GeminiSyncAction record={record} onSync={() => loadRecords()} geminiConfig={geminiConfig} disabled={!actionEnabled} />
          </Space>
        );
      }
    },
  ];

  const items = [
    {
      key: 'records',
      label: t('records.recordList'),
      children: (
        <>
          {/* Statistics */}
          <Spin spinning={loading}>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title={t('records.totalSubmissions')} value={stats.total || 0} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title={t('records.uniqueProblems')} value={stats.unique_problems || 0} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title={t('records.solvedProblems')} value={stats.solved || 0} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title={t('records.successRate')} value={stats.successRate || 0} suffix="%" precision={1} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title={t('records.languages')} value={stats.languages || 0} />
              </Col>
            </Row>
          </Spin>

          {/* Record List */}
          <Card
            title={t('records.recordList')}
            extra={
              <Button onClick={() => setFilters(prev => ({ ...prev }))} loading={loading}>
                  {t('common.refresh')}
                </Button>
            }
          >
            {/* 3. Always show filter form directly */}
            <Card
              size="small"
              style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
              title={
                <Space>
                  <FilterOutlined />
                  {t('records.filters')}
              </Space>
            }
              extra={
                <Button
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={handleClearFilters}
                >
                  {t('records.clearFilters')}
                </Button>
              }
            >
              <Form
                form={filterForm}
                layout="vertical"
                onFinish={handleFilter}
                initialValues={filters}
              >
                <Row gutter={[16, 0]}>
                  <Col span={6} style={{ minWidth: 200 }}>
                    <Form.Item name="problem_title" label={t('records.problemTitle')}>
                      <Input placeholder={t('records.enterProblemTitle')} />
                    </Form.Item>
                  </Col>
                  <Col span={6} style={{ minWidth: 160 }}>
                    <Form.Item name="problem_id" label={t('records.problemId')}>
                      <Input placeholder={t('records.enterProblemId')} type="number" />
                    </Form.Item>
                  </Col>
                  <Col span={6} style={{ minWidth: 180 }}>
                    <Form.Item name="status" label={t('records.status')}>
                      <Select placeholder={t('records.selectStatus')} allowClear>
                        <Select.Option value="Accepted">{t('records.accepted')}</Select.Option>
                        <Select.Option value="Wrong Answer">{t('records.wrongAnswer')}</Select.Option>
                        <Select.Option value="Time Limit Exceeded">{t('records.timeLimitExceeded')}</Select.Option>
                        <Select.Option value="Runtime Error">{t('records.runtimeError')}</Select.Option>
                        <Select.Option value="Memory Limit Exceeded">{t('records.memoryLimitExceeded')}</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6} style={{ minWidth: 160 }}>
                    <Form.Item name="language" label={t('records.language')}>
                      <Select placeholder={t('records.selectLanguage')} allowClear>
                        <Select.Option value="python">{t('records.python')}</Select.Option>
                        <Select.Option value="java">{t('records.java')}</Select.Option>
                        <Select.Option value="cpp">{t('records.cpp')}</Select.Option>
                        <Select.Option value="c">{t('records.c')}</Select.Option>
                        <Select.Option value="javascript">{t('records.javascript')}</Select.Option>
                        <Select.Option value="typescript">{t('records.typescript')}</Select.Option>
                        <Select.Option value="go">{t('records.go')}</Select.Option>
                        <Select.Option value="rust">{t('records.rust')}</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6} style={{ minWidth: 180 }}>
                    <Form.Item name="oj_sync_status" label={t('records.ojSyncStatus')}>
                      <Select placeholder={t('records.selectOjSyncStatus')} allowClear>
                        <Select.Option value="pending">{t('records.gitSyncStatusPending')}</Select.Option>
                        <Select.Option value="syncing">{t('records.gitSyncStatusSyncing')}</Select.Option>
                        <Select.Option value="synced">{t('records.gitSyncStatusSynced')}</Select.Option>
                        <Select.Option value="failed">{t('records.gitSyncStatusFailed')}</Select.Option>
                        <Select.Option value="paused">{t('records.gitSyncStatusPaused')}</Select.Option>
                        <Select.Option value="retry">{t('records.gitSyncStatusRetry')}</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6} style={{ minWidth: 180 }}>
                    <Form.Item name="ai_sync_status" label={t('records.aiSyncStatus')}>
                      <Select placeholder={t('records.selectAiSyncStatus')} allowClear>
                        <Select.Option value="pending">{t('records.gitSyncStatusPending')}</Select.Option>
                        <Select.Option value="syncing">{t('records.gitSyncStatusSyncing')}</Select.Option>
                        <Select.Option value="synced">{t('records.gitSyncStatusSynced')}</Select.Option>
                        <Select.Option value="failed">{t('records.gitSyncStatusFailed')}</Select.Option>
                        <Select.Option value="paused">{t('records.gitSyncStatusPaused')}</Select.Option>
                        <Select.Option value="retry">{t('records.gitSyncStatusRetry')}</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6} style={{ minWidth: 220 }}>
                    <Form.Item name="timeRange" label={t('records.submitTime')}>
                      <RangePicker style={{ width: '100%' }} placeholder={[t('records.startDate'), t('records.endDate')]} />
                    </Form.Item>
                  </Col>
                  <Col span={6} style={{ minWidth: 120, display: 'flex', alignItems: 'flex-end' }}>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        {t('records.filter')}
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

            {/* Git Configuration Status */}
            {configStatus && !configStatus.configured && (
              <Alert
                message={t('git.configRequired')}
                description={t('git.configRequiredDesc') || configStatus.message}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* LeetCode Configuration Status */}
            {/* Removed LeetCode configuration status alert */}

            {(geminiConfig === null && configStatus) && (
              <Alert
                message={t('records.geminiConfigRequired')}
                description={t('records.geminiConfigRequiredDesc')}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Batch Sync Controls */}
            <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
              <Col>
                <Text strong>{t('git.syncOrder')}:</Text>
                <Select
                  value={syncOrder}
                  onChange={setSyncOrder}
                  style={{ width: 120, marginLeft: 8 }}
                >
                  <Select.Option value="asc">{t('git.timeAsc')}</Select.Option>
                  <Select.Option value="desc">{t('git.timeDesc')}</Select.Option>
                </Select>
              </Col>
              <Col>
                <Button
                  type="primary"
                  onClick={handleBatchSync}
                  loading={batchSyncLoading}
                  disabled={selectedRecords.length === 0}
                  icon={<SyncOutlined />}
                >
                  {t('git.batchSync', { count: selectedRecords.length })}
                </Button>
              </Col>
              <Col>
                <Text type="secondary">
                  {t('git.selectedCount', { count: selectedRecords.length, total: records.length })}
                </Text>
              </Col>
            </Row>
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={records}
                rowKey={(record) => record?.id || Math.random().toString()}
                scroll={{ x: 2100 }}
                rowSelection={{
                  selectedRowKeys: selectedRecords,
                  onChange: (selectedRowKeys, selectedRows) => {
                    setSelectedRecords(selectedRowKeys);
                  },
                  getCheckboxProps: (record) => ({
                    disabled: record.oj_sync_status === 'syncing',
                    name: record?.submission_id || record?.id,
                  }),
                }}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} ${t('common.items')}`
                }}
                locale={{
                  emptyText: t('records.noRecords')
                }}
              />
            </Spin>
          </Card>
        </>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>
        <BookOutlined /> {t('records.title')}
      </Title>

      <Tabs items={items} />

      {/* View Record Modal */}
      {/* Removed Modal 相关代码 */}
    </div>
  );
};

export default Records;
