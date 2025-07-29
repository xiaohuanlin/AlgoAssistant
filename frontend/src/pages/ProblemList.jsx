import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Tag, Space } from 'antd';
import { BookOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import problemService from '../services/problemService';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/common/DataTable';
import ActionButton from '../components/common/ActionButton';
import ProblemBankStatistics from '../components/problem/ProblemBankStatistics';


const ProblemList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [onlySelf, setOnlySelf] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({});

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        ...filters,
        only_self: onlySelf,
        title: searchValue || undefined,
      };
      const data = await problemService.getProblems(params);
      setProblems(data.items);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (error) {
      message.error(t('problem.loadError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters, onlySelf, searchValue, t]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleViewDetail = (problem) => {
    navigate(`/problem/${problem.id}`);
  };

  const handleOnlySelfChange = (checked) => {
    setOnlySelf(checked);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (newPagination) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchValue('');
    setOnlySelf(false);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleRefresh = () => {
    // Only refresh data, keep all filters
    fetchProblems();
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
        <ActionButton type="link" variant="link" onClick={() => handleViewDetail(record)}>
          {text}
        </ActionButton>
      ),
    },
    {
      title: t('problem.source'),
      dataIndex: 'source',
      key: 'source',
      render: (source) => <Tag color={sourceColor[source] || 'default'} style={{ fontWeight: 500 }}>{source}</Tag>,
    },
    {
      title: t('problem.difficulty'),
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => <Tag color={difficultyColor[difficulty] || 'default'} style={{ fontWeight: 500 }}>{difficulty}</Tag>,
    },
    {
      title: t('problem.tags'),
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => tags && tags.length > 0 ? tags.map(tag => <Tag key={tag}>{tag}</Tag>) : '-',
    },
    {
      title: t('problem.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
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
      key: 'search',
      label: t('problem.searchPlaceholder'),
      type: 'input',
      placeholder: t('problem.searchPlaceholder'),
      value: searchValue,
      onChange: setSearchValue,
    },
    {
      key: 'source',
      label: t('problem.source'),
      type: 'select',
      placeholder: t('problem.sourcePlaceholder'),
      value: filters.source,
      onChange: (value) => handleFilterChange('source', value),
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
      onChange: (value) => handleFilterChange('difficulty', value),
      options: [
        { label: 'Easy', value: 'Easy' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Hard', value: 'Hard' },
      ],
    },
    {
      key: 'onlySelf',
      label: t('problem.viewMode'),
      type: 'select',
      placeholder: t('problem.viewModePlaceholder'),
      value: onlySelf ? 'self' : 'all',
      onChange: (value) => handleOnlySelfChange(value === 'self'),
      options: [
        { label: t('problem.allUsers'), value: 'all' },
        { label: t('problem.onlySelf'), value: 'self' },
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
    <div>
      {/* Statistics Section */}
      <ProblemBankStatistics />

      <DataTable
        title={t('problem.listTitle')}
        subtitle={t('problem.subtitle')}
        data={problems}
        columns={columns}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (current, pageSize) => {
            setPagination(prev => ({ ...prev, current, pageSize }));
          },
        }}
        filters={dataTableFilters}
        actions={headerActions}
        onRefresh={handleRefresh}
        onFilterChange={clearFilters}
        showFilterButtons={false}
      />
    </div>
  );
};

export default ProblemList;
