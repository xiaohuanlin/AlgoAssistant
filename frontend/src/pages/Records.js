import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  message,
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
  PlusOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import recordsService from '../services/recordsService';
import gitSyncService from '../services/gitSyncService';
import { DataTable, StatusIndicator, SyncAction } from '../components/common';
import GitSyncAction from '../components/GitSyncAction';
import GeminiSyncAction from '../components/GeminiSyncAction';
import NotionSyncAction from '../components/NotionSyncAction';
import { useConfig } from '../contexts/ConfigContext';

const { RangePicker } = DatePicker;
const { Title, Text, Link } = Typography;

// Common status mapping functions
const getStatusColor = (executionResult) => {
  switch (executionResult.toLowerCase()) {
    case 'accepted':
      return 'success';
    case 'wrong answer':
      return 'error';
    case 'time limit exceeded':
      return 'warning';
    case 'memory limit exceeded':
      return 'warning';
    case 'runtime error':
      return 'error';
    case 'compile error':
      return 'error';
    default:
      return 'default';
  }
};

const getLanguageColor = (language) => {
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
  return colors[language?.toLowerCase()] || 'default';
};

const getSyncStatusConfig = (status, t) => {
  const configs = {
    'pending': { color: 'default', text: t('records.statusPending') },
    'syncing': { color: 'processing', text: t('records.statusSyncing') },
    'completed': { color: 'success', text: t('records.statusCompleted') },
    'failed': { color: 'error', text: t('records.statusFailed') },
    'paused': { color: 'warning', text: t('records.statusPaused') }
  };
  return configs[status] || { color: 'default', text: status };
};

const Records = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filterForm] = Form.useForm();

  // State management
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [batchSyncLoading, setBatchSyncLoading] = useState(false);
  const [syncOrder, setSyncOrder] = useState('desc');
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Config context
  const {
    hasGitConfig,
    hasGeminiConfig,
    hasNotionConfig,
    gitConfig,
    geminiConfig,
    notionConfig
  } = useConfig();

  // Load data
  const loadRecords = useCallback(async (newFilters = {}) => {
    setLoading(true);
    try {
      const queryFilters = { ...filters, ...newFilters };
      const [recordsData, statsData] = await Promise.all([
        recordsService.getRecords({
          ...queryFilters,
          limit: pagination.pageSize,
          offset: (pagination.current - 1) * pagination.pageSize,
          sort_order: syncOrder
        }),
        recordsService.getStats()
      ]);

      setRecords(recordsData.items || recordsData);
      setStats(statsData);
      setPagination(prev => ({
        ...prev,
        total: recordsData.total || recordsData.length
      }));
    } catch (error) {
      message.error(t('records.loadError'));
      console.error('Load records error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.current, pagination.pageSize, syncOrder, t]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Event handlers
  const handleViewRecord = (record) => {
    navigate(`/records/${record.id}`);
  };

  const handleOJSync = async (record) => {
    message.info(t('records.ojSyncNotImplemented'));
  };

  const handleBatchSync = async () => {
    if (selectedRecords.length === 0) {
      message.warning(t('records.selectRecordsFirst'));
      return;
    }

    setBatchSyncLoading(true);
    try {
      await gitSyncService.batchSync(selectedRecords);
      message.success(t('git.batchSyncStarted'));
      setSelectedRecords([]);
      loadRecords();
    } catch (error) {
      message.error(t('git.syncError'));
    } finally {
      setBatchSyncLoading(false);
    }
  };

  const handleFilter = (values) => {
    const newFilters = {};
    Object.keys(values).forEach(key => {
      if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
        if (key === 'dateRange' && values[key]?.length === 2) {
          newFilters.start_time = values[key][0].format('YYYY-MM-DD');
          newFilters.end_time = values[key][1].format('YYYY-MM-DD');
        } else {
          newFilters[key] = values[key];
        }
      }
    });
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadRecords(newFilters);
  };

  const handleSelectionChange = (selectedRowKeys) => {
    setSelectedRecords(selectedRowKeys);
  };

  const isSyncActionEnabled = (record) => {
    return record.oj_sync_status === 'completed';
  };

  // Table columns configuration
  const columns = [
    {
      title: t('records.problemNumber'),
      dataIndex: 'problem_number',
      key: 'problem_number',
      width: 80,
      render: (problemNumber, record) => problemNumber ? (
        <Button
          type="link"
          style={{ padding: 0, height: 'auto' }}
          onClick={() => navigate(`/problem/${record.problem_number}`)}
        >
          <Text strong>{problemNumber}</Text>
        </Button>
      ) : <Text type="secondary">-</Text>
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
      render: (executionResult) => (
        <StatusIndicator
          status={executionResult}
          type="execution"
          size="small"
        />
      )
    },
    {
      title: t('records.language'),
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: (language) => (
        <Tag color={getLanguageColor(language)}>
          {language}
        </Tag>
      )
    },
    {
      title: t('records.ojType'),
      dataIndex: 'oj_type',
      key: 'oj_type',
      width: 80,
      render: (ojType) => (
        <Tag color="blue">
          {ojType}
        </Tag>
      )
    },
    {
      title: t('records.githubSyncStatus'),
      dataIndex: 'github_sync_status',
      key: 'github_sync_status',
      width: 120,
      render: (status) => (
        <StatusIndicator
          status={status}
          type="sync"
          size="small"
        />
      )
    },
    {
      title: t('records.aiAnalysisStatus'),
      dataIndex: 'ai_sync_status',
      key: 'ai_sync_status',
      width: 120,
      render: (status) => (
        <StatusIndicator
          status={status}
          type="sync"
          size="small"
        />
      )
    },
    {
      title: t('records.submitTime'),
      dataIndex: 'submit_time',
      key: 'submit_time',
      width: 150,
      render: (submitTime) => (
        <Text style={{ fontSize: '12px' }}>
          {submitTime ? dayjs(submitTime).format('YYYY-MM-DD HH:mm') : '-'}
        </Text>
      )
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
            <GitSyncAction
              record={record}
              onSync={() => loadRecords()}
              disabled={record.github_sync_status === 'completed' || !actionEnabled}
            />
            <GeminiSyncAction
              record={record}
              onSync={() => loadRecords()}
              geminiConfig={geminiConfig}
              disabled={!actionEnabled}
            />
            <NotionSyncAction
              record={record}
              onSync={() => loadRecords()}
              disabled={!hasNotionConfig() || !actionEnabled}
            />
          </Space>
        );
      }
    },
  ];

  // Filter configuration
  const filterConfig = [
    {
      key: 'problem_title',
      label: t('records.problem'),
      type: 'input',
      placeholder: t('records.searchByTitle'),
      value: filters.problem_title,
      onChange: (value) => setFilters(prev => ({ ...prev, problem_title: value }))
    },
    {
      key: 'execution_result',
      label: t('records.status'),
      type: 'select',
      placeholder: t('records.selectStatus'),
      value: filters.execution_result,
      onChange: (value) => setFilters(prev => ({ ...prev, execution_result: value })),
      options: [
        { label: 'Accepted', value: 'Accepted' },
        { label: 'Wrong Answer', value: 'Wrong Answer' },
        { label: 'Time Limit Exceeded', value: 'Time Limit Exceeded' },
        { label: 'Runtime Error', value: 'Runtime Error' },
        { label: 'Compile Error', value: 'Compile Error' }
      ]
    },
    {
      key: 'language',
      label: t('records.language'),
      type: 'select',
      placeholder: t('records.selectLanguage'),
      value: filters.language,
      onChange: (value) => setFilters(prev => ({ ...prev, language: value })),
      options: [
        { label: 'Python', value: 'python' },
        { label: 'Java', value: 'java' },
        { label: 'C++', value: 'cpp' },
        { label: 'JavaScript', value: 'javascript' }
      ]
    },
    {
      key: 'dateRange',
      label: t('records.submitTime'),
      type: 'dateRange',
      value: filters.dateRange,
      onChange: (value) => setFilters(prev => ({ ...prev, dateRange: value }))
    }
  ];

  // Actions configuration
  const actions = [
    {
      text: t('records.createRecord'),
      type: 'primary',
      icon: <PlusOutlined />,
      onClick: () => navigate('/records/create')
    },
    {
      text: `${t('git.batchSync')} (${selectedRecords.length})`,
      icon: <SyncOutlined />,
      onClick: handleBatchSync,
      loading: batchSyncLoading,
      disabled: selectedRecords.length === 0
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('records.totalSubmissions')}
              value={stats.total_submissions || 0}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('records.solvedProblems')}
              value={stats.accepted_submissions || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('records.successRate')}
              value={stats.success_rate || 0}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('records.uniqueProblems')}
              value={stats.unique_problems || 0}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Data Table */}
      <DataTable
        title={t('records.title')}
        subtitle={t('records.recordList')}
        data={records}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize }));
          }
        }}
        filters={filterConfig}
        selectedRowKeys={selectedRecords}
        onSelectionChange={handleSelectionChange}
        onRefresh={() => loadRecords()}
        onFilterChange={handleFilter}
        actions={actions}
        extra={
          <Space>
            <Text strong>{t('git.syncOrder')}:</Text>
            <Select
              value={syncOrder}
              onChange={setSyncOrder}
              style={{ width: 120 }}
            >
              <Select.Option value="asc">{t('git.timeAsc')}</Select.Option>
              <Select.Option value="desc">{t('git.timeDesc')}</Select.Option>
            </Select>
          </Space>
        }
      />
    </div>
  );
};

export default Records;
