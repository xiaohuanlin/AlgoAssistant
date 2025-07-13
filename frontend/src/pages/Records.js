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
  Modal,
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
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import recordsService from '../services/recordsService';
import gitSyncService from '../services/gitSyncService';
import GitSyncAction from '../components/GitSyncAction';
import GitSyncStatusPage from '../components/GitSyncStatusPage';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text, Link } = Typography;

const Records = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  // Batch sync states
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [syncOrder, setSyncOrder] = useState('asc');
  const [batchSyncLoading, setBatchSyncLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({});
  const [filterForm] = Form.useForm();

  const loadRecords = useCallback(async (filterParams = {}) => {
    setLoading(true);
    try {
      console.log('Loading records with filters:', filterParams);
      console.log('Current token:', localStorage.getItem('token'));

      const [recordsData, statsData] = await Promise.all([
        recordsService.getRecords(filterParams),
        recordsService.getStats()
      ]);
      console.log('Records data:', recordsData);
      console.log('Stats data:', statsData);

      // Ensure we have valid arrays/objects
      const validRecords = Array.isArray(recordsData) ? recordsData : [];
      const validStats = statsData && typeof statsData === 'object' ? statsData : {};

      console.log('Valid records:', validRecords);
      console.log('Valid stats:', validStats);

      setRecords(validRecords);
      setStats(validStats);
    } catch (error) {
      console.error('Error loading records:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

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
        // Parallel requests for all data
        const [recordsData, statsData, configData] = await Promise.all([
          recordsService.getRecords(filters),
          recordsService.getStats(),
          gitSyncService.getConfigurationStatus().catch(err => ({
            configured: false,
            message: 'Failed to check configuration',
            action: 'configure',
            actionText: 'Configure Git Repository'
          }))
        ]);

        // Set data
        const validRecords = Array.isArray(recordsData) ? recordsData : [];
        const validStats = statsData && typeof statsData === 'object' ? statsData : {};

        setRecords(validRecords);
        setStats(validStats);
        setConfigStatus(configData);
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

  const handleViewRecord = (record) => {
    if (!record) {
      message.error('Invalid record');
      return;
    }
    setCurrentRecord(record);
    setViewModalVisible(true);
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

  const getLeetCodeUrl = (record) => {
    if (!record) return '#';
    // Use submission_url if available
    if (record.submission_url) {
      return record.submission_url;
    }
    // Fallback to problem title slug if available
    if (record.title_slug) {
      return `https://leetcode.com/problems/${record.title_slug}/`;
    }
    // If no direct link available, use problem title for search
    const problemTitle = record.problem_title || '';
    return `https://leetcode.com/problemset/all/?search=${encodeURIComponent(problemTitle)}`;
  };

  const getProblemDisplay = (record) => {
    if (!record) return 'Unknown Problem';
    if (record.problem && record.problem.title) {
      return `${record.id}. ${record.problem.title}`;
    }
    return `#${record.id}`;
  };

  const getLanguageForHighlight = (language) => {
    if (!language || typeof language !== 'string') return 'plaintext';
    const lowerLanguage = language.toLowerCase();
    if (lowerLanguage.includes('python')) return 'python';
    if (lowerLanguage.includes('java')) return 'java';
    if (lowerLanguage.includes('cpp')) return 'cpp';
    if (lowerLanguage.includes('c')) return 'c';
    if (lowerLanguage.includes('javascript')) return 'javascript';
    if (lowerLanguage.includes('typescript')) return 'typescript';
    if (lowerLanguage.includes('go')) return 'go';
    if (lowerLanguage.includes('rust')) return 'rust';
    return 'plaintext';
  };

  const columns = [
    {
      title: t('records.problemNumber'),
      dataIndex: 'problem_id',
      key: 'problem_id',
      width: 80,
      render: (problemId) => {
        if (!problemId) return <Text type="secondary">-</Text>;
        return <Text strong>{problemId}</Text>;
      }
    },
    {
      title: t('records.problem'),
      key: 'problem',
      width: 300,
      render: (_, record) => (
        <Tooltip title={t('records.openInLeetCode')}>
          <Link
            href={getLeetCodeUrl(record)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1890ff' }}
          >
            <Text strong style={{ fontSize: '14px' }}>
              {getProblemDisplay(record)}
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
      title: t('records.syncStatus'),
      dataIndex: 'oj_status',
      key: 'oj_status',
      width: 100,
      render: (oj_status) => {
        const safeSyncStatus = oj_status && typeof oj_status === 'string' ? oj_status : 'pending';
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
      dataIndex: 'git_sync_status',
      key: 'git_sync_status',
      width: 120,
      render: (gitSyncStatus) => {
        const safeGitSyncStatus = gitSyncStatus && typeof gitSyncStatus === 'string' ? gitSyncStatus : 'pending';
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
      title: t('records.aiAnalysisStatus'),
      dataIndex: 'ai_analysis',
      key: 'ai_analysis',
      width: 100,
      render: (aiAnalysis) => {
        if (aiAnalysis && typeof aiAnalysis === 'object') {
          return (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              {t('records.analyzed')}
            </Tag>
          );
        }
        return (
          <Tag color="default">
            {t('records.notAnalyzed')}
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
      title: t('records.externalServices'),
      key: 'external_services',
      width: 120,
      render: (_, record) => {
        const services = [];
        if (record.notion_url) {
          services.push(
            <Tag key="notion" color="green" style={{ fontSize: '10px', marginBottom: 2 }}>
              Notion
            </Tag>
          );
        }
        if (record.github_pushed) {
          services.push(
            <Tag key="github" color="purple" style={{ fontSize: '10px', marginBottom: 2 }}>
              GitHub
            </Tag>
          );
        }
        if (services.length > 0) {
          return <div>{services}</div>;
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
      title: t('records.actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title={t('records.view')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewRecord(record)}
            />
          </Tooltip>
          <GitSyncAction
            record={record}
            onSync={loadRecords}
          />
        </Space>
      )
    }
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
                    <Form.Item name="git_sync_status" label={t('records.gitSyncStatus')}>
                      <Select placeholder={t('records.selectGitSyncStatus')} allowClear>
                        <Select.Option value="pending">{t('records.gitSyncStatusPending')}</Select.Option>
                        <Select.Option value="syncing">{t('records.gitSyncStatusSyncing')}</Select.Option>
                        <Select.Option value="synced">{t('records.gitSyncStatusSynced')}</Select.Option>
                        <Select.Option value="failed">{t('records.gitSyncStatusFailed')}</Select.Option>
                        <Select.Option value="paused">{t('records.gitSyncStatusPaused')}</Select.Option>
                        <Select.Option value="retry">{t('records.gitSyncStatusRetry')}</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6} style={{ minWidth: 140 }}>
                    <Form.Item name="oj_type" label={t('records.ojType')}>
                      <Select placeholder={t('records.selectOjType')} allowClear>
                        <Select.Option value="leetcode">LeetCode</Select.Option>
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
                description={configStatus.message}
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
                rowKey={(record) => record?.submission_id || Math.random().toString()}
                scroll={{ x: 2100 }}
                rowSelection={{
                  selectedRowKeys: selectedRecords,
                  onChange: (selectedRowKeys, selectedRows) => {
                    setSelectedRecords(selectedRowKeys);
                  },
                  getCheckboxProps: (record) => ({
                    disabled: record.oj_status === 'syncing',
                    name: record.submission_id || record.id,
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
      <Modal
        title={t('records.viewRecord')}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            {t('common.close')}
          </Button>
        ]}
        width={800}
      >
        {currentRecord && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>{t('records.language')}:</Text>
                <Tag color={getLanguageColor(currentRecord.language && typeof currentRecord.language === 'string' ? currentRecord.language : '')} style={{ marginLeft: 8 }}>
                  {currentRecord.language || 'Unknown'}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong>{t('records.status')}:</Text>
                <Tag
                  color={getStatusColor(currentRecord.execution_result && typeof currentRecord.execution_result === 'string' ? currentRecord.execution_result : '')}
                  style={{ marginLeft: 8 }}
                >
                  {currentRecord.execution_result || 'Unknown'}
                </Tag>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Text strong>{t('records.ojType')}:</Text>
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {currentRecord.oj_type || 'leetcode'}
                </Tag>
              </Col>
              <Col span={8}>
                <Text strong>{t('records.syncStatus')}:</Text>
                <Tag
                  color={currentRecord.oj_status === 'synced' ? 'success' :
                         currentRecord.oj_status === 'failed' ? 'error' :
                         currentRecord.oj_status === 'syncing' ? 'processing' : 'default'}
                  style={{ marginLeft: 8 }}
                >
                  {currentRecord.oj_status || 'pending'}
                </Tag>
              </Col>
              <Col span={8}>
                <Text strong>{t('records.submitTime')}:</Text>
                <Text style={{ marginLeft: 8, fontSize: '12px' }}>
                  {(() => {
                    try {
                      if (!currentRecord.submit_time) return '-';
                      const dayjsTime = dayjs(currentRecord.submit_time);
                      if (!dayjsTime.isValid()) return '-';
                      return dayjsTime.format('MM-DD HH:mm');
                    } catch (error) {
                      console.error('Error formatting submit_time in modal:', error, currentRecord.submit_time);
                      return '-';
                    }
                  })()}
                </Text>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>{t('records.createdAt')}:</Text>
                <Text style={{ marginLeft: 8, fontSize: '12px' }}>
                  {(() => {
                    try {
                      if (!currentRecord.created_at) return '-';
                      const dayjsTime = dayjs(currentRecord.created_at);
                      if (!dayjsTime.isValid()) return '-';
                      return dayjsTime.format('YYYY-MM-DD HH:mm');
                    } catch (error) {
                      console.error('Error formatting created_at in modal:', error, currentRecord.created_at);
                      return '-';
                    }
                  })()}
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>{t('records.updatedAt')}:</Text>
                <Text style={{ marginLeft: 8, fontSize: '12px' }}>
                  {(() => {
                    try {
                      if (!currentRecord.updated_at) return '-';
                      const dayjsTime = dayjs(currentRecord.updated_at);
                      if (!dayjsTime.isValid()) return '-';
                      return dayjsTime.format('YYYY-MM-DD HH:mm');
                    } catch (error) {
                      console.error('Error formatting updated_at in modal:', error, currentRecord.updated_at);
                      return '-';
                    }
                  })()}
                </Text>
              </Col>
            </Row>



            {/* Error Information */}
            {(currentRecord.runtime_error || currentRecord.compile_error) && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.errorInformation')}:</Text>
                <div style={{ marginTop: 8 }}>
                  {currentRecord.runtime_error && (
                    <div style={{ marginBottom: 8 }}>
                      <Text type="danger" strong>{t('records.runtimeError')}:</Text>
                      <div style={{
                        marginTop: 4,
                        padding: 8,
                        backgroundColor: '#fff2f0',
                        border: '1px solid #ffccc7',
                        borderRadius: 4,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {currentRecord.runtime_error}
                      </div>
                    </div>
                  )}
                  {currentRecord.compile_error && (
                    <div style={{ marginBottom: 8 }}>
                      <Text type="danger" strong>{t('records.compileError')}:</Text>
                      <div style={{
                        marginTop: 4,
                        padding: 8,
                        backgroundColor: '#fff2f0',
                        border: '1px solid #ffccc7',
                        borderRadius: 4,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {currentRecord.compile_error}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}





            <div style={{ marginBottom: 16 }}>
              <Text strong>{t('records.problemTitle')}:</Text>
              <Link
                href={getLeetCodeUrl(currentRecord)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: 8, color: '#1890ff' }}
              >
                {currentRecord.problem_title}
              </Link>
            </div>

            {currentRecord.topic_tags && Array.isArray(currentRecord.topic_tags) && currentRecord.topic_tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.topicTags')}:</Text>
                <div style={{ marginTop: 8 }}>
                  {currentRecord.topic_tags.map((tag, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                      {tag || 'Unknown Tag'}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {currentRecord.submission_url && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.submissionUrl')}:</Text>
                <Link
                  href={currentRecord.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginLeft: 8, color: '#1890ff' }}
                >
                  {t('records.viewSubmission')}
                </Link>
              </div>
            )}

            {/* AI Analysis Information */}
            {currentRecord.ai_analysis && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.aiAnalysis')}:</Text>
                <Tag color="green" style={{ marginLeft: 8 }}>
                  {t('records.analyzed')}
                </Tag>
                <div style={{
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #91d5ff',
                  borderRadius: 4,
                  fontSize: '12px'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(currentRecord.ai_analysis, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* External Service Information */}
            {(currentRecord.notion_url || currentRecord.github_pushed) && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.externalServices')}:</Text>
                <div style={{ marginTop: 8 }}>
                  {currentRecord.notion_url && (
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary">{t('records.notionUrl')}:</Text>
                      <Link
                        href={currentRecord.notion_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: 8, color: '#1890ff' }}
                      >
                        {t('records.viewInNotion')}
                      </Link>
                    </div>
                  )}
                  {currentRecord.github_pushed && (
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary">{t('records.githubPushed')}:</Text>
                      <Text style={{ marginLeft: 8 }}>
                        {(() => {
                          try {
                            const dayjsTime = dayjs(currentRecord.github_pushed);
                            if (!dayjsTime.isValid()) return '-';
                            return dayjsTime.format('YYYY-MM-DD HH:mm:ss');
                          } catch (error) {
                            console.error('Error formatting github_pushed:', error, currentRecord.github_pushed);
                            return '-';
                          }
                        })()}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <Text strong>{t('records.code')}:</Text>
              <div style={{
                marginTop: 8,
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 400
              }}>
                <SyntaxHighlighter
                  language={getLanguageForHighlight(currentRecord.language)}
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    borderRadius: 4,
                    fontSize: '12px',
                    lineHeight: '1.4'
                  }}
                >
                  {currentRecord.code || ''}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Records;
