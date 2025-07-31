import React, { useState, useEffect, useCallback } from 'react';
import { message, Tag, Space } from 'antd';
import {
  PlusOutlined,
  ProfileOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatLocalTime } from '../utils';
import problemService from '../services/problemService';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/common/DataTable';
import ActionButton from '../components/common/ActionButton';
import ProblemBankStatistics from '../components/problem/ProblemBankStatistics';
import useTableFilters from '../hooks/useTableFilters';
import {
  GradientPageHeader,
  ModernCard,
  GRADIENT_THEMES,
} from '../components/ui/ModernDesignSystem';

const ProblemList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState([]);
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
    clearAllFilters,
    createAutoFilterHandler,
    createFilterClearHandler,
  } = useTableFilters((apiFilters) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchProblems(apiFilters);
  });

  const fetchProblems = useCallback(
    async (filterParams = {}) => {
      setLoading(true);
      try {
        const params = {
          skip: (pagination.current - 1) * pagination.pageSize,
          limit: pagination.pageSize,
          ...filterParams,
        };
        const data = await problemService.getProblems(params);
        setProblems(data.items);
        setPagination((prev) => ({ ...prev, total: data.total }));
      } catch (error) {
        message.error(t('problem.loadError') + ': ' + error.message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pagination.current, pagination.pageSize, t],
  );

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleViewDetail = (problem) => {
    navigate(`/problem/${problem.id}`);
  };

  const handleRefresh = () => {
    // Refresh data with current filters
    const currentApiFilters = {};
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ''
      ) {
        currentApiFilters[key] = filters[key];
      }
    });
    fetchProblems(currentApiFilters);
  };

  const difficultyColor = {
    Easy: 'success',
    Medium: 'warning',
    Hard: 'error',
  };
  const sourceColor = {
    leetcode: 'processing',
    custom: 'default',
  };

  const columns = [
    {
      title: t('problem.title'),
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <ActionButton
          type="link"
          variant="link"
          onClick={() => handleViewDetail(record)}
        >
          {text}
        </ActionButton>
      ),
    },
    {
      title: t('problem.source'),
      dataIndex: 'source',
      key: 'source',
      render: (source) => (
        <Tag
          color={sourceColor[source] || 'default'}
          style={{ fontWeight: 500 }}
        >
          {source}
        </Tag>
      ),
    },
    {
      title: t('problem.difficulty'),
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => (
        <Tag
          color={difficultyColor[difficulty] || 'default'}
          style={{ fontWeight: 500 }}
        >
          {difficulty}
        </Tag>
      ),
    },
    {
      title: t('problem.tags'),
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) =>
        tags && tags.length > 0
          ? tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
          : '-',
    },
    {
      title: t('problem.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => (
        <span style={{ whiteSpace: 'nowrap' }}>{formatLocalTime(date)}</span>
      ),
    },
    {
      title: t('problem.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <ActionButton type="view" onClick={() => handleViewDetail(record)} />
        </Space>
      ),
    },
  ];

  const dataTableFilters = [
    {
      key: 'title',
      label: t('problem.searchPlaceholder'),
      type: 'input',
      placeholder: t('problem.searchPlaceholder'),
      value: filters.title,
      onChange: createAutoFilterHandler('title', 500),
      onClear: createFilterClearHandler('title'),
    },
    {
      key: 'source',
      label: t('problem.source'),
      type: 'select',
      placeholder: t('problem.sourcePlaceholder'),
      value: filters.source,
      onChange: createAutoFilterHandler('source'),
      onClear: createFilterClearHandler('source'),
      options: [
        { label: 'LeetCode', value: 'leetcode' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      key: 'difficulty',
      label: t('problem.difficulty'),
      type: 'select',
      placeholder: t('problem.difficultyPlaceholder'),
      value: filters.difficulty,
      onChange: createAutoFilterHandler('difficulty'),
      onClear: createFilterClearHandler('difficulty'),
      options: [
        { label: 'Easy', value: 'Easy' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Hard', value: 'Hard' },
      ],
    },
    {
      key: 'only_self',
      label: t('problem.viewMode'),
      type: 'select',
      placeholder: t('problem.viewModePlaceholder'),
      value: filters.only_self,
      onChange: createAutoFilterHandler('only_self'),
      onClear: createFilterClearHandler('only_self'),
      options: [
        { label: t('problem.allUsers'), value: false },
        { label: t('problem.onlySelf'), value: true },
      ],
    },
  ];

  const headerActions = [
    {
      text: t('common.create'),
      type: 'primary',
      icon: <PlusOutlined />,
      onClick: () => navigate('/problem/create'),
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
          <ProfileOutlined
            style={{
              fontSize: isMobile ? '24px' : '36px',
              color: 'white',
            }}
          />
        }
        title={t('problem.listTitle', 'Problem Bank')}
        subtitle={
          <>
            <BarChartOutlined
              style={{ fontSize: isMobile ? '16px' : '20px' }}
            />
            {t('problem.subtitle', 'Manage your coding problems')}
          </>
        }
        isMobile={isMobile}
        gradient={GRADIENT_THEMES.primary}
      />

      {/* Statistics Section */}
      <ModernCard
        title={t('problem.statistics', 'Statistics')}
        icon={<BarChartOutlined />}
        iconGradient={GRADIENT_THEMES.success}
        isMobile={isMobile}
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        <ProblemBankStatistics />
      </ModernCard>

      {/* Problems List */}
      <ModernCard
        title={t('problem.listTitle', 'Problem List')}
        icon={<ProfileOutlined />}
        iconGradient={GRADIENT_THEMES.info}
        isMobile={isMobile}
      >
        <DataTable
          data={problems}
          columns={columns}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (current, pageSize) => {
              setPagination((prev) => ({ ...prev, current, pageSize }));
            },
          }}
          filters={dataTableFilters}
          actions={headerActions}
          onRefresh={handleRefresh}
          onClearFilters={clearAllFilters}
          showFilterButtons={false}
        />
      </ModernCard>
    </div>
  );
};

export default ProblemList;
