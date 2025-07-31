import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  message,
  Tag,
  Typography,
  Row,
  Col,
  Tooltip,
  Form,
  Space,
} from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  PlusOutlined,
  EyeOutlined,
  HistoryOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import recordsService from '../services/recordsService';
import { DataTable, StatusIndicator } from '../components/common';
import ResponsiveStatCard from '../components/dashboard/ResponsiveStatCard';
import {
  GradientPageHeader,
  ModernCard,
  GRADIENT_THEMES,
} from '../components/ui/ModernDesignSystem';
import GitSyncAction from '../components/GitSyncAction';
import GeminiSyncAction from '../components/GeminiSyncAction';
import NotionSyncAction from '../components/NotionSyncAction';
import { useConfig } from '../contexts/ConfigContext';
import useTableFilters from '../hooks/useTableFilters';

const { Text, Link } = Typography;

// Common status mapping functions

const getLanguageColor = (language) => {
  const colors = {
    python: 'blue',
    java: 'orange',
    cpp: 'purple',
    c: 'cyan',
    javascript: 'yellow',
    typescript: 'blue',
    go: 'green',
    rust: 'red',
  };
  return colors[language?.toLowerCase()] || 'default';
};

const Records = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  Form.useForm();

  // State management
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use the new table filters hook
  const {
    filters,
    handleFilter,
    clearAllFilters,
    createAutoFilterHandler,
    createFilterClearHandler,
  } = useTableFilters((apiFilters) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadRecords(apiFilters);
  });

  // Config context
  const { geminiConfig, hasNotionConfig } = useConfig();

  // Load data
  const loadRecords = useCallback(
    async (newFilters = {}) => {
      setLoading(true);
      try {
        const queryFilters = { ...filters, ...newFilters };
        // Filter out empty values to avoid sending empty strings to backend
        const cleanFilters = {};
        Object.keys(queryFilters).forEach((key) => {
          const value = queryFilters[key];
          if (value !== undefined && value !== null && value !== '') {
            if (
              key === 'dateRange' &&
              Array.isArray(value) &&
              value.length === 2
            ) {
              // Convert dateRange to start_time and end_time for API
              cleanFilters.start_time = value[0].startOf('day').toISOString();
              cleanFilters.end_time = value[1].endOf('day').toISOString();
            } else {
              cleanFilters[key] = value;
            }
          }
        });

        const [recordsData, statsData] = await Promise.all([
          recordsService.getRecords({
            ...cleanFilters,
            limit: pagination.pageSize,
            offset: (pagination.current - 1) * pagination.pageSize,
          }),
          recordsService.getStats(),
        ]);

        setRecords(recordsData.items || recordsData);
        setStats(statsData);
        setPagination((prev) => ({
          ...prev,
          total: recordsData.total || recordsData.length,
          current: recordsData.page || prev.current,
        }));
      } catch (error) {
        message.error(t('records.loadError'));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, pagination.current, pagination.pageSize, t],
  );

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Event handlers
  const handleViewRecord = (record) => {
    navigate(`/records/${record.id}`);
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
      title: t('records.problemNumber', 'Problem #'),
      dataIndex: 'problem_number',
      key: 'problem_number',
      width: isMobile ? 60 : 80,
      render: (problemNumber, record) =>
        problemNumber ? (
          <Button
            type="link"
            style={{ padding: 0, height: 'auto' }}
            onClick={() => navigate(`/problem/${record.problem_number}`)}
          >
            <Text strong>{problemNumber}</Text>
          </Button>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: t('records.problem', 'Problem'),
      key: 'problem_title',
      width: isMobile ? 200 : 300,
      ellipsis: true,
      render: (_, record) => (
        <Tooltip title={record.problem_title || `#${record.id}`}>
          <Link
            href={record.submission_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1890ff',
              display: 'block',
              whiteSpace: 'nowrap',
            }}
          >
            <Text
              strong
              style={{
                fontSize: '14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isMobile ? '180px' : '280px',
                display: 'inline-block',
              }}
            >
              {record.problem_title || `#${record.id}`}
            </Text>
          </Link>
        </Tooltip>
      ),
    },
    {
      title: t('records.status', 'Status'),
      dataIndex: 'execution_result',
      key: 'execution_result',
      width: isMobile ? 100 : 120,
      render: (executionResult) => (
        <StatusIndicator
          status={executionResult}
          type="execution"
          size="small"
        />
      ),
    },
    {
      title: t('records.language', 'Language'),
      dataIndex: 'language',
      key: 'language',
      width: isMobile ? 80 : 100,
      render: (language) => (
        <Tag color={getLanguageColor(language)}>{language}</Tag>
      ),
    },
    {
      title: t('records.ojType', 'OJ Type'),
      dataIndex: 'oj_type',
      key: 'oj_type',
      width: isMobile ? 70 : 80,
      render: (ojType) => {
        const displayName =
          ojType === 'leetcode'
            ? 'LeetCode'
            : ojType === 'other'
              ? t('common.other', 'Other')
              : ojType;
        return <Tag color="blue">{displayName}</Tag>;
      },
    },
    {
      title: t('records.githubSyncStatus', 'GitHub Sync'),
      dataIndex: 'github_sync_status',
      key: 'github_sync_status',
      width: isMobile ? 100 : 120,
      render: (status) => (
        <StatusIndicator status={status} type="sync" size="small" />
      ),
    },
    {
      title: t('records.aiAnalysisStatus', 'AI Analysis'),
      dataIndex: 'ai_sync_status',
      key: 'ai_sync_status',
      width: isMobile ? 100 : 120,
      render: (status) => (
        <StatusIndicator status={status} type="sync" size="small" />
      ),
    },
    {
      title: t('records.submitTime', 'Submit Time'),
      dataIndex: 'submit_time',
      key: 'submit_time',
      width: isMobile ? 120 : 150,
      render: (submitTime) => (
        <Text
          style={{
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          {submitTime
            ? dayjs(submitTime).format(
                isMobile ? 'MM-DD HH:mm' : 'YYYY-MM-DD HH:mm',
              )
            : '-'}
        </Text>
      ),
    },
    {
      title: t('records.actions', 'Actions'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const actionEnabled = isSyncActionEnabled(record);
        return (
          <Space>
            <Tooltip
              title={
                actionEnabled
                  ? t('records.view', 'View')
                  : t('records.pleaseSyncOJFirst', 'Please sync OJ first')
              }
            >
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handleViewRecord(record)}
                disabled={!actionEnabled}
              >
                {t('records.view', 'View')}
              </Button>
            </Tooltip>
            <GitSyncAction
              record={record}
              onSync={() => loadRecords()}
              disabled={
                record.github_sync_status === 'completed' || !actionEnabled
              }
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
      },
    },
  ];

  // Filter configuration
  const filterConfig = [
    {
      key: 'problem_title',
      label: t('records.problem', 'Problem'),
      type: 'input',
      placeholder: t('records.searchByTitle', 'Search by title'),
      value: filters.problem_title,
      onChange: createAutoFilterHandler('problem_title', 500),
      onClear: createFilterClearHandler('problem_title'),
    },
    {
      key: 'problem_id',
      label: t('records.problemId', 'Problem ID'),
      type: 'input',
      placeholder: t('records.searchByProblemId', 'Search by problem ID'),
      value: filters.problem_id,
      onChange: createAutoFilterHandler('problem_id', 500),
      onClear: createFilterClearHandler('problem_id'),
    },
    {
      key: 'status',
      label: t('records.status', 'Status'),
      type: 'select',
      placeholder: t('records.selectStatus', 'Select status'),
      value: filters.status,
      onChange: createAutoFilterHandler('status'),
      onClear: createFilterClearHandler('status'),
      options: [
        { label: t('records.statusAccepted', 'Accepted'), value: 'Accepted' },
        {
          label: t('records.statusWrongAnswer', 'Wrong Answer'),
          value: 'Wrong Answer',
        },
        {
          label: t('records.statusTimeLimitExceeded', 'Time Limit Exceeded'),
          value: 'Time Limit Exceeded',
        },
        {
          label: t('records.statusRuntimeError', 'Runtime Error'),
          value: 'Runtime Error',
        },
        {
          label: t('records.statusCompileError', 'Compile Error'),
          value: 'Compile Error',
        },
      ],
    },
    {
      key: 'oj_type',
      label: t('records.ojType', 'OJ Type'),
      type: 'select',
      placeholder: t('records.selectOjType', 'Select OJ type'),
      value: filters.oj_type,
      onChange: createAutoFilterHandler('oj_type'),
      onClear: createFilterClearHandler('oj_type'),
      options: [
        { label: 'LeetCode', value: 'leetcode' },
        { label: t('common.other', 'Other'), value: 'other' },
      ],
    },
    {
      key: 'language',
      label: t('records.language', 'Language'),
      type: 'select',
      placeholder: t('records.selectLanguage', 'Select language'),
      value: filters.language,
      onChange: createAutoFilterHandler('language'),
      onClear: createFilterClearHandler('language'),
      options: [
        { label: 'Python', value: 'python' },
        { label: 'Python3', value: 'python3' },
        { label: 'Java', value: 'java' },
        { label: 'C++', value: 'cpp' },
        { label: 'JavaScript', value: 'javascript' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'Go', value: 'go' },
        { label: 'Rust', value: 'rust' },
      ],
    },
    {
      key: 'dateRange',
      label: t('records.submitTime', 'Submit Time'),
      type: 'dateRange',
      value: filters.dateRange,
      onChange: createAutoFilterHandler('dateRange'),
      onClear: createFilterClearHandler('dateRange'),
    },
  ];

  // Actions configuration
  const actions = [
    {
      text: t('common.create', 'Create'),
      type: 'primary',
      icon: <PlusOutlined />,
      onClick: () => navigate('/records/create'),
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
          <HistoryOutlined
            style={{
              fontSize: isMobile ? '24px' : '36px',
              color: 'white',
            }}
          />
        }
        title={t('records.title', 'Records')}
        subtitle={
          <>
            <BarChartOutlined
              style={{ fontSize: isMobile ? '16px' : '20px' }}
            />
            {t(
              'records.manageSubmissionRecords',
              'Manage your submission records',
            )}
          </>
        }
        isMobile={isMobile}
        gradient={GRADIENT_THEMES.success}
      />

      {/* Statistics Section */}
      <ModernCard
        title={t('common.statistics', 'Statistics')}
        icon={<BarChartOutlined />}
        iconGradient={GRADIENT_THEMES.info}
        isMobile={isMobile}
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <ResponsiveStatCard
              title={t('records.totalSubmissions', 'Total Submissions')}
              value={stats.total || 0}
              prefix={<BookOutlined />}
              color="#1890ff"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <ResponsiveStatCard
              title={t('records.solvedProblems', 'Solved Problems')}
              value={stats.solved || 0}
              prefix={<CheckCircleOutlined />}
              color="#52c41a"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <ResponsiveStatCard
              title={t('records.successRate', 'Success Rate')}
              value={stats.successRate || 0}
              suffix="%"
              prefix={<SyncOutlined />}
              color={
                stats.successRate >= 70
                  ? '#52c41a'
                  : stats.successRate >= 40
                    ? '#faad14'
                    : '#f5222d'
              }
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <ResponsiveStatCard
              title={t('records.uniqueProblems', 'Unique Problems')}
              value={stats.unique_problems || 0}
              prefix={<EyeOutlined />}
              color="#fa8c16"
              loading={loading}
            />
          </Col>
        </Row>
      </ModernCard>

      {/* Records List */}
      <ModernCard
        title={t('records.recordList', 'Record List')}
        icon={<HistoryOutlined />}
        iconGradient={GRADIENT_THEMES.primary}
        isMobile={isMobile}
      >
        <DataTable
          data={records}
          columns={columns}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
            },
          }}
          filters={filterConfig}
          selectedRowKeys={selectedRecords}
          onSelectionChange={handleSelectionChange}
          onRefresh={() => loadRecords()}
          onFilterChange={() => {
            const currentValues = {};
            filterConfig.forEach((filter) => {
              if (
                filter.value !== undefined &&
                filter.value !== null &&
                filter.value !== ''
              ) {
                // Special handling for dateRange which is an array
                if (
                  filter.key === 'dateRange' &&
                  Array.isArray(filter.value) &&
                  filter.value.length === 2
                ) {
                  currentValues[filter.key] = filter.value;
                } else if (filter.key !== 'dateRange') {
                  currentValues[filter.key] = filter.value;
                }
              }
            });
            handleFilter(currentValues);
          }}
          onClearFilters={clearAllFilters}
          actions={actions}
          showFilterButtons={false}
        />
      </ModernCard>
    </div>
  );
};

export default Records;
