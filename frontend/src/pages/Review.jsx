import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  message,
  Space,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClearOutlined,
  CalendarOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import reviewService from '../services/reviewService';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { DataTable, StatusIndicator } from '../components/common';
import ResponsiveStatCard from '../components/dashboard/ResponsiveStatCard';
import {
  GradientPageHeader,
  ModernCard,
  GRADIENT_THEMES
} from '../components/ui/ModernDesignSystem';
import { useNavigate } from 'react-router-dom';
import useTableFilters from '../hooks/useTableFilters';

const { TextArea } = Input;

const Review = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Options for form selects
  const notificationTypeOptions = [
    { label: 'Email', value: 'email' },
    { label: 'Push', value: 'push' },
    { label: 'SMS', value: 'sms' }
  ];

  const notificationStatusOptions = [
    { label: 'Pending to Send', value: 'pending' },
    { label: 'Sent', value: 'sent' },
    { label: 'Failed', value: 'failed' }
  ];

  // State management
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [batchLoading, setBatchLoading] = useState(false);
  const [sorter] = useState({ field: 'created_at', order: 'descend' });

  // Use the new table filters hook
  const {
    filters,
    handleFilter,
    clearAllFilters,
    createAutoFilterHandler,
    createFilterClearHandler
  } = useTableFilters((apiFilters) => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchReviews(apiFilters);
  });

  const fetchReviews = useCallback(async (newFilters = {}) => {
    setLoading(true);
    try {
      const { total, items } = await reviewService.filterReviews({
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        sort_by: sorter.field,
        sort_order: sorter.order === 'descend' ? 'desc' : 'asc',
        ...newFilters,
      });
      setReviews(items || []);
      setPagination(prev => ({ ...prev, total: total || 0 }));
      // Only clear selection when filters change, not on pagination
      if (Object.keys(newFilters).length > 0) {
        setSelectedRowKeys([]);
      }
    } catch (error) {
      message.error(t('review.loadError'));
      console.error('Load reviews error:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, sorter.field, sorter.order, t]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await reviewService.getStats(14);
      setStats(data);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [fetchReviews, fetchStats]);

  const handleEditReview = (review) => {
    setEditingReview(review);
    form.setFieldsValue({
      wrong_reason: review.wrong_reason,
      review_plan: review.review_plan,
      next_review_date: review.next_review_date ? dayjs(review.next_review_date) : null,
      review_count: review.review_count,
      notification_type: review.notification_type,
      notification_status: review.notification_status,
    });
    setModalVisible(true);
  };

  const handleSubmitEdit = async (values) => {
    try {
      await reviewService.updateReview(editingReview.id, {
        ...values,
        next_review_date: values.next_review_date ? values.next_review_date.toISOString() : undefined,
      });
      message.success(t('review.updateReviewSuccess'));
      setModalVisible(false);
      setEditingReview(null);
      form.resetFields();
      fetchReviews();
    } catch (error) {
      message.error(t('review.updateReviewError') + error.message);
    }
  };

  const handleCancelEdit = () => {
    setModalVisible(false);
    setEditingReview(null);
    form.resetFields();
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t('review.selectReviewsFirst'));
      return;
    }

    setBatchLoading(true);
    try {
      await reviewService.batchDelete(selectedRowKeys);
      message.success(t('review.batchDeleteSuccess'));
      setSelectedRowKeys([]);
      fetchReviews();
      fetchStats();
    } catch (error) {
      message.error(t('review.batchDeleteError'));
    } finally {
      setBatchLoading(false);
    }
  };


  const handleViewReview = (record) => {
    navigate(`/review/${record.id}`);
  };

  const handleSelectionChange = (selectedRowKeys) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const handleDeleteAll = async () => {
    Modal.confirm({
      title: t('review.deleteAllConfirmTitle'),
      content: t('review.deleteAllConfirmContent'),
      icon: <ExclamationCircleOutlined />,
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okType: 'danger',
      onOk: async () => {
        setBatchLoading(true);
        try {
          const result = await reviewService.deleteAll();
          message.success(t('review.deleteAllSuccess', { count: result.deleted }));
          setSelectedRowKeys([]);
          fetchReviews();
          fetchStats();
        } catch (error) {
          message.error(t('review.deleteAllError'));
        } finally {
          setBatchLoading(false);
        }
      }
    });
  };


  const getReviewStatus = (review) => {
    const now = new Date();
    const nextReview = new Date(review.next_review_date);
    if (nextReview < now) {
      return 'overdue';
    } else if (nextReview.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'due_today';
    } else {
      return 'normal';
    }
  };

  const columns = [
    {
      title: t('review.problemId', 'Problem ID'),
      dataIndex: 'problem_id',
      key: 'problem_id',
      width: 80,
      render: (id) => (
        <Button
          type="link"
          style={{ padding: 0, height: 'auto' }}
          onClick={() => navigate(`/problem/${id}`)}
        >
          {id}
        </Button>
      ),
    },
    {
      title: t('review.problemTitle', 'Problem Title'),
      dataIndex: 'problem_title',
      key: 'problem_title',
      width: 300,
      ellipsis: true,
      render: (text, record) => (
        <Tooltip title={text}>
          <Button
            type="link"
            style={{ padding: 0, height: 'auto' }}
            onClick={() => navigate(`/problem/${record.problem_id}`)}
          >
            {text}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: t('review.wrongReason', 'Wrong Reason'),
      dataIndex: 'wrong_reason',
      key: 'wrong_reason',
      width: 200,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: t('review.reviewCount', 'Review Count'),
      dataIndex: 'review_count',
      key: 'review_count',
      width: 100,
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'default'}>
          {count}
        </Tag>
      ),
    },
    {
      title: t('review.nextReview', 'Next Review'),
      dataIndex: 'next_review_date',
      key: 'next_review_date',
      width: 150,
      render: (date, record) => (
        <StatusIndicator
          status={getReviewStatus(record)}
          type="review"
          size="small"
        />
      ),
    },
    {
      title: t('review.notificationStatus', 'Notification Status'),
      dataIndex: 'notification_status',
      key: 'notification_status',
      width: 120,
      render: (status) => (
        <StatusIndicator
          status={status}
          type="notification"
          size="small"
        />
      ),
    },
    {
      title: t('review.notificationType', 'Notification Type'),
      dataIndex: 'notification_type',
      key: 'notification_type',
      width: 100,
      render: (type) => (
        <Tag color="blue">
          {t(`review.type.${type}`, type || 'Unknown')}
        </Tag>
      ),
    },
    {
      title: t('review.notificationSentAt', 'Sent At'),
      dataIndex: 'notification_sent_at',
      key: 'notification_sent_at',
      width: 160,
      render: (val) => (
        <span style={{ fontSize: '12px' }}>
          {val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'}
        </span>
      ),
    },
    {
      title: t('common.actions', 'Actions'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title={t('common.view', 'View')}>
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewReview(record)}
            >
              {t('common.view', 'View')}
            </Button>
          </Tooltip>
          <Tooltip title={t('common.edit', 'Edit')}>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditReview(record)}
            >
              {t('common.edit', 'Edit')}
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Filter configuration
  const filterConfig = [
    {
      key: 'problem_id',
      label: t('review.problemId', 'Problem ID'),
      type: 'input',
      placeholder: t('review.problemId', 'Problem ID'),
      value: filters.problem_id,
      onChange: createAutoFilterHandler('problem_id', 500),
      onClear: createFilterClearHandler('problem_id')
    },
    {
      key: 'problem_title',
      label: t('review.problemTitle', 'Problem Title'),
      type: 'input',
      placeholder: t('review.problemTitlePlaceholder', 'Search by problem title'),
      value: filters.problem_title,
      onChange: createAutoFilterHandler('problem_title', 500),
      onClear: createFilterClearHandler('problem_title')
    },
    {
      key: 'notification_status',
      label: t('review.notificationStatus', 'Notification Status'),
      type: 'select',
      placeholder: t('review.notificationStatus', 'Notification Status'),
      value: filters.notification_status,
      onChange: createAutoFilterHandler('notification_status'),
      onClear: createFilterClearHandler('notification_status'),
      options: [
        { label: t('review.status.pending', 'Pending'), value: 'pending' },
        { label: t('review.status.sent', 'Sent'), value: 'sent' },
        { label: t('review.status.failed', 'Failed'), value: 'failed' }
      ]
    },
    {
      key: 'notification_type',
      label: t('review.notificationType', 'Notification Type'),
      type: 'select',
      placeholder: t('review.notificationType', 'Notification Type'),
      value: filters.notification_type,
      onChange: createAutoFilterHandler('notification_type'),
      onClear: createFilterClearHandler('notification_type'),
      options: [
        { label: t('review.type.email', 'Email'), value: 'email' },
        { label: t('review.type.push', 'Push'), value: 'push' },
        { label: t('review.type.sms', 'SMS'), value: 'sms' }
      ]
    },
    {
      key: 'timeRange',
      label: t('review.nextReview', 'Next Review'),
      type: 'dateRange',
      value: filters.timeRange,
      onChange: createAutoFilterHandler('timeRange'),
      onClear: createFilterClearHandler('timeRange')
    }
  ];

  // Actions configuration
  const actions = [
    {
      text: `${t('review.batchDelete', 'Batch Delete')} (${selectedRowKeys.length})`,
      icon: <DeleteOutlined />,
      onClick: handleBatchDelete,
      loading: batchLoading,
      disabled: selectedRowKeys.length === 0,
      danger: true
    },
    {
      text: t('review.deleteAll', 'Delete All'),
      icon: <ClearOutlined />,
      onClick: handleDeleteAll,
      loading: batchLoading,
      danger: true
    }
  ];

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: isMobile ? '16px' : '24px'
    }}>
      {/* Modern Page Header */}
      <GradientPageHeader
        icon={<CalendarOutlined style={{
          fontSize: isMobile ? '24px' : '36px',
          color: 'white'
        }} />}
        title={t('review.title', 'Reviews')}
        subtitle={(
          <>
            <BarChartOutlined style={{ fontSize: isMobile ? '16px' : '20px' }} />
            {t('review.manageProblemReviews', 'Manage your problem reviews')}
          </>
        )}
        isMobile={isMobile}
        gradient={GRADIENT_THEMES.warning}
      />

      {/* Statistics Section */}
      <ModernCard
        title={t('common.statistics', 'Statistics')}
        icon={<BarChartOutlined />}
        iconGradient={GRADIENT_THEMES.cyan}
        isMobile={isMobile}
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <ResponsiveStatCard
              title={t('review.totalReviews', 'Total Reviews')}
              value={stats.total || 0}
              prefix={<BookOutlined />}
              color="#1890ff"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <ResponsiveStatCard
              title={t('review.pendingReviews', 'Pending Reviews')}
              value={stats.pending || 0}
              prefix={<ClockCircleOutlined />}
              color="#faad14"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <ResponsiveStatCard
              title={t('review.completedReviews', 'Completed Reviews')}
              value={stats.completed || 0}
              prefix={<CheckCircleOutlined />}
              color="#52c41a"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <ResponsiveStatCard
              title={t('review.overdueReviews', 'Overdue Reviews')}
              value={stats.overdue || 0}
              prefix={<ExclamationCircleOutlined />}
              color="#f5222d"
              loading={loading}
            />
          </Col>
        </Row>
      </ModernCard>

      {/* Reviews List */}
      <ModernCard
        title={t('review.reviewList', 'Review List')}
        icon={<CalendarOutlined />}
        iconGradient={GRADIENT_THEMES.purple}
        isMobile={isMobile}
      >
        <DataTable
          data={reviews}
          columns={columns}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
              // Don't clear selection when changing pages to allow cross-page selection
            }
          }}
          filters={filterConfig}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={handleSelectionChange}
          onRefresh={() => fetchReviews()}
          onFilterChange={() => {
            const currentValues = {};
            filterConfig.forEach(filter => {
              if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                // Special handling for timeRange which is an array
                if (filter.key === 'timeRange' && Array.isArray(filter.value) && filter.value.length === 2) {
                  currentValues[filter.key] = filter.value;
                } else if (filter.key !== 'timeRange') {
                  currentValues[filter.key] = filter.value;
                }
              }
            });
            handleFilter(currentValues);
          }}
          onClearFilters={clearAllFilters}
          actions={actions}
          showFilterButtons={false}
          rowKey="id"
        />      </ModernCard>

      {/* Edit review record modal */}
      <Modal
        title={t('review.editReview', 'Edit Review')}
        open={modalVisible}
        onOk={form.submit}
        onCancel={handleCancelEdit}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitEdit}
        >
          <Form.Item
            label={t('review.wrongReason', 'Wrong Reason')}
            name="wrong_reason"
            rules={[{ required: true, message: t('review.wrongReasonRequired', 'Please enter the wrong reason') }]}
          >
            <TextArea rows={3} placeholder={t('review.wrongReasonPlaceholder', 'Describe why you got this problem wrong...')} />
          </Form.Item>
          <Form.Item
            label={t('review.reviewPlan', 'Review Plan')}
            name="review_plan"
            rules={[{ required: true, message: t('review.reviewPlanRequired', 'Please enter the review plan') }]}
          >
            <TextArea rows={4} placeholder={t('review.reviewPlanPlaceholder', 'Set a specific review plan...')} />
          </Form.Item>
          <Form.Item
            label={t('review.nextReview', 'Next Review Date')}
            name="next_review_date"
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label={t('review.reviewCount', 'Review Count')}
            name="review_count"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label={t('review.notificationType', 'Notification Type')}
            name="notification_type"
          >
            <Select options={notificationTypeOptions.map(opt => ({ ...opt, label: t(`review.type.${opt.value}`, opt.label) }))} allowClear placeholder={t('review.selectNotificationType', 'Select notification type')} />
          </Form.Item>
          <Form.Item
            label={t('review.notificationStatus', 'Notification Status')}
            name="notification_status"
          >
            <Select options={notificationStatusOptions.map(opt => ({ ...opt, label: t(`review.status.${opt.value}`, opt.label) }))} allowClear placeholder={t('review.selectNotificationStatus', 'Select notification status')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Review;
