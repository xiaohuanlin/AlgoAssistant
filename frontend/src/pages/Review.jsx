import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
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
  Statistic,
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
} from '@ant-design/icons';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import reviewService from '../services/reviewService';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Line } from '@ant-design/charts';
import { Segmented } from 'antd';

const { TextArea } = Input;

const Review = () => {
  const { t } = useTranslation();
  const notificationTypeOptions = [
    { label: t('review.type.email', 'Email'), value: 'email' },
    { label: t('review.type.push', 'Push'), value: 'push' },
    { label: t('review.type.sms', 'SMS'), value: 'sms' },
  ];
  const notificationStatusOptions = [
    { label: t('review.status.pending', 'Pending to Send'), value: 'pending' },
    { label: t('review.status.sent', 'Sent'), value: 'sent' },
    { label: t('review.status.failed', 'Failed'), value: 'failed' },
  ];
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [sorter, setSorter] = useState({ field: 'created_at', order: 'descend' });
  const [filterForm] = Form.useForm();
  const [trendDays, setTrendDays] = useState(14);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchReviews = React.useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { total, items } = await reviewService.filterReviews({
        limit: params.pageSize || pagination.pageSize,
        offset: ((params.current || pagination.current) - 1) * (params.pageSize || pagination.pageSize),
        sort_by: params.sortField || sorter.field,
        sort_order: params.sortOrder === 'ascend' ? 'asc' : 'desc',
        ...filters,
      });
      setReviews(items);
      setPagination((prev) => ({ ...prev, total }));
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, sorter.field, sorter.order, filters]);

  // Fetch stats and trend
  const fetchStats = React.useCallback(async (days = trendDays) => {
    setTrendLoading(true);
    try {
      const data = await reviewService.getStats(days);
      setStats(data);
    } finally {
      setTrendLoading(false);
    }
  }, [trendDays]);

  useEffect(() => {
    fetchStats(trendDays);
  }, [fetchStats, trendDays]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleMarkAsReviewed = async (reviewId) => {
    try {
      await reviewService.markAsReviewed(reviewId);
      message.success(t('review.markAsReviewedSuccess'));
      fetchReviews();
    } catch (error) {
      message.error(t('review.markAsReviewedError') + error.message);
    }
  };

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

  const handleBatchMark = async () => {
    await reviewService.batchMarkReviewed(selectedRowKeys);
    setSelectedRowKeys([]);
    fetchReviews();
    fetchStats(trendDays);
    message.success(t('review.batchMarkReviewedSuccess'));
  };

  const handleBatchDelete = async () => {
    await reviewService.batchDelete(selectedRowKeys);
    setSelectedRowKeys([]);
    fetchReviews();
    fetchStats(trendDays);
    message.success(t('review.batchDeleteSuccess'));
  };

  const handleFilter = (values) => {
    const filterParams = { ...values };
    if (values.timeRange && values.timeRange.length === 2) {
      filterParams.start_date = values.timeRange[0].startOf('day').toISOString();
      filterParams.end_date = values.timeRange[1].endOf('day').toISOString();
      delete filterParams.timeRange;
    }
    if (filterParams.min_review_count === '' || filterParams.min_review_count == null) delete filterParams.min_review_count;
    if (filterParams.max_review_count === '' || filterParams.max_review_count == null) delete filterParams.max_review_count;
    setFilters(filterParams);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClearFilters = () => {
    filterForm.resetFields();
    setFilters({});
    setPagination({ current: 1, pageSize: pagination.pageSize, total: 0 });
  };

  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    let newFilters = { ...filters };
    if (val === 'pending') {
      newFilters.review_count = 0;
    } else if (val === 'completed') {
      newFilters.review_count = 1;
    } else if (val === 'overdue') {
      newFilters.overdue = true;
    } else {
      delete newFilters.review_count;
      delete newFilters.overdue;
    }
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const getReviewStatusColor = (review) => {
    const now = new Date();
    const nextReview = new Date(review.next_review_date);
    if (nextReview < now) {
      return 'error'; // Overdue
    } else if (nextReview.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'warning'; // Due today
    } else {
      return 'success'; // Normal
    }
  };

  const getReviewStatusText = (review) => {
    const now = new Date();
    const nextReview = new Date(review.next_review_date);
    if (nextReview < now) {
      return t('review.overdue');
    } else if (nextReview.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return t('review.dueToday');
    } else {
      return reviewService.formatReviewDate(review.next_review_date);
    }
  };

  const columns = [
    {
      title: t('review.problemId'),
      dataIndex: 'problem_id',
      key: 'problem_id',
      width: 80,
      render: (id) => (
        <Button type="link" onClick={() => window.location.href = `/problem/${id}`}>{id}</Button>
      ),
    },
    {
      title: t('records.problemTitle'),
      dataIndex: 'problem_title',
      key: 'problem_title',
      ellipsis: true,
      render: (text, record) => (
        <Tooltip title={text}>
          <Button type="link" onClick={() => window.location.href = `/problem/${record.problem_id}`}>{text}</Button>
        </Tooltip>
      ),
    },
    {
      title: t('review.wrongReason'),
      dataIndex: 'wrong_reason',
      key: 'wrong_reason',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: t('review.reviewCount'),
      dataIndex: 'review_count',
      key: 'review_count',
      width: 100,
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'default'}>
          {count}
        </Tag>
      ),
      filters: [
        { text: t('review.status.pending', 'Pending'), value: 'pending' },
        { text: t('review.status.completed', 'Completed'), value: 'completed' },
        { text: t('review.status.overdue', 'Overdue'), value: 'overdue' },
      ],
      onFilter: (value, record) => {
        if (value === 'pending') return record.review_count === 0;
        if (value === 'completed') return record.review_count > 0;
        if (value === 'overdue') {
          const now = new Date();
          const nextReview = new Date(record.next_review_date);
          return nextReview < now;
        }
        return true;
      },
    },
    {
      title: t('review.nextReview'),
      dataIndex: 'next_review_date',
      key: 'next_review_date',
      width: 120,
      render: (date, record) => (
        <Tag color={getReviewStatusColor(record)}>
          {getReviewStatusText(record)}
        </Tag>
      ),
    },
    {
      title: t('review.notificationStatus'),
      dataIndex: 'notification_status',
      key: 'notification_status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'sent' ? 'green' : status === 'failed' ? 'red' : 'default'}>
          {t(`review.status.${status}`, status)}
        </Tag>
      ),
    },
    {
      title: t('review.notificationType'),
      dataIndex: 'notification_type',
      key: 'notification_type',
      width: 100,
      render: (type) => t(`review.type.${type}`, type),
    },
    {
      title: t('review.notificationSentAt'),
      dataIndex: 'notification_sent_at',
      key: 'notification_sent_at',
      width: 160,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditReview(record)}
          >
            {t('common.edit')}
          </Button>
          <Button
            size="small"
            onClick={() => window.location.href = `/review/${record.id}`}
          >
            {t('common.view')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Filter form */}
      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }} title={<Space><FilterOutlined />{t('records.filters')}</Space>} extra={<Button size="small" icon={<ClearOutlined />} onClick={handleClearFilters}>{t('records.clearFilters')}</Button>}>
        <Form form={filterForm} layout="vertical" onFinish={handleFilter} initialValues={filters}>
          <Row gutter={[16, 0]}>
            <Col span={6} style={{ minWidth: 160 }}>
              <Form.Item name="problem_id" label={t('review.problemId')}>
                <Input placeholder={t('review.problemId')} type="number" />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 160 }}>
              <Form.Item name="problem_title" label={t('records.problemTitle')}>
                <Input placeholder={t('records.problemTitlePlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 160 }}>
              <Form.Item name="min_review_count" label={t('review.minReviewCount', 'Min Review Count')}>
                <Input placeholder={t('review.minReviewCount', 'Min Review Count')} type="number" />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 160 }}>
              <Form.Item name="max_review_count" label={t('review.maxReviewCount', 'Max Review Count')}>
                <Input placeholder={t('review.maxReviewCount', 'Max Review Count')} type="number" />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 180 }}>
              <Form.Item name="notification_status" label={t('review.notificationStatus')}>
                <Select placeholder={t('review.notificationStatus')} allowClear options={notificationStatusOptions.map(opt => ({ ...opt, label: t(`review.status.${opt.value}`, opt.label) }))} />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 180 }}>
              <Form.Item name="notification_type" label={t('review.notificationType')}>
                <Select placeholder={t('review.notificationType')} allowClear options={notificationTypeOptions.map(opt => ({ ...opt, label: t(`review.type.${opt.value}`, opt.label) }))} />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 220 }}>
              <Form.Item name="timeRange" label={t('review.nextReview')}>
                <DatePicker.RangePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 120, display: 'flex', alignItems: 'flex-end' }}>
              <Form.Item>
                <Button type="primary" htmlType="submit">{t('records.filter')}</Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
      {/* Batch operation buttons */}
      <Space style={{ marginBottom: 16 }}>
        <Tooltip title={selectedRowKeys.length ? '' : t('review.selectToBatchDelete')}>
          <Button onClick={handleBatchDelete} disabled={!selectedRowKeys.length}>{t('review.batchDelete')}</Button>
        </Tooltip>
      </Space>
      {/* All review records */}
      <Card title={t('review.allReviews')}>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={reviews}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => t('review.pagination.showing', { start: range[0], end: range[1], total }),
          }}
          onChange={(pagination, filters, sorter) => {
            setPagination({ ...pagination, current: pagination.current, pageSize: pagination.pageSize });
            setSorter({ field: sorter.field || 'created_at', order: sorter.order || 'descend' });
          }}
          locale={{
            emptyText: loading ? t('common.loading') : t('review.noData'),
          }}
          scroll={{ x: 'max-content' }}
          tableLayout="fixed"
        />
      </Card>

      {/* Edit review record modal */}
      <Modal
        title={t('review.editReview')}
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
            <Select options={notificationTypeOptions.map(opt => ({ ...opt, label: t(`review.type.${opt.value}`, opt.label) }))} allowClear />
          </Form.Item>
          <Form.Item
            label={t('review.notificationStatus', 'Notification Status')}
            name="notification_status"
          >
            <Select options={notificationStatusOptions.map(opt => ({ ...opt, label: t(`review.status.${opt.value}`, opt.label) }))} allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Review;
