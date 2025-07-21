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

const { TextArea } = Input;

const notificationTypeOptions = [
  { label: 'Email', value: 'email' },
  { label: 'Push', value: 'push' },
  { label: 'SMS', value: 'sms' },
];

const notificationStatusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Sent', value: 'sent' },
  { label: 'Failed', value: 'failed' },
];

const Review = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [sorter, setSorter] = useState({ field: 'created_at', order: 'descend' });
  const [filterForm] = Form.useForm();

  const fetchReviews = React.useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { total, items } = await reviewService.getReviews({
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

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleMarkAsReviewed = async (reviewId) => {
    try {
      await reviewService.markAsReviewed(reviewId);
      message.success(t('review.markAsReviewedSuccess', 'Review completed!'));
      fetchReviews();
    } catch (error) {
      message.error(t('review.markAsReviewedError', 'Failed to mark review as completed: ') + error.message);
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
      message.success(t('review.updateReviewSuccess', 'Review record updated successfully!'));
      setModalVisible(false);
      setEditingReview(null);
      form.resetFields();
      fetchReviews();
    } catch (error) {
      message.error(t('review.updateReviewError', 'Failed to update review record: ') + error.message);
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
  };

  const handleBatchDelete = async () => {
    await reviewService.batchDelete(selectedRowKeys);
    setSelectedRowKeys([]);
    fetchReviews();
  };

  const handleFilter = (values) => {
    const filterParams = { ...values };
    if (values.timeRange && values.timeRange.length === 2) {
      filterParams.start_date = values.timeRange[0].startOf('day').toISOString();
      filterParams.end_date = values.timeRange[1].endOf('day').toISOString();
      delete filterParams.timeRange;
    }
    setFilters(filterParams);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClearFilters = () => {
    filterForm.resetFields();
    setFilters({});
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
      return t('review.overdue', 'Overdue');
    } else if (nextReview.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return t('review.dueToday', 'Due today');
    } else {
      return reviewService.formatReviewDate(review.next_review_date);
    }
  };

  const columns = [
    {
      title: t('review.problemId', 'Problem ID'),
      dataIndex: 'problem_id',
      key: 'problem_id',
      width: 80,
    },
    {
      title: t('review.wrongReason', 'Wrong Reason'),
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
      title: t('review.reviewPlan', 'Review Plan'),
      dataIndex: 'review_plan',
      key: 'review_plan',
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
      width: 120,
      render: (date, record) => (
        <Tag color={getReviewStatusColor(record)}>
          {getReviewStatusText(record)}
        </Tag>
      ),
    },
    {
      title: t('review.notificationStatus', 'Notification Status'),
      dataIndex: 'notification_status',
      key: 'notification_status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'sent' ? 'green' : status === 'failed' ? 'red' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: t('review.notificationType', 'Notification Type'),
      dataIndex: 'notification_type',
      key: 'notification_type',
      width: 100,
    },
    {
      title: t('review.notificationSentAt', 'Notification Time'),
      dataIndex: 'notification_sent_at',
      key: 'notification_sent_at',
      width: 160,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: t('common.actions', 'Actions'),
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleMarkAsReviewed(record.id)}
          >
            {t('review.markAsReviewed', 'Mark Reviewed')}
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditReview(record)}
          >
            {t('common.edit', 'Edit')}
          </Button>
          <Button
            size="small"
            onClick={() => window.location.href = `/review/${record.id}`}
          >
            {t('common.view', 'View')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Statistics cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('review.stats.total', 'Total Reviews')}
              value={stats.total || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('review.stats.pending', 'Pending')}
              value={stats.pending || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('review.stats.completed', 'Completed')}
              value={stats.completed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('review.stats.due', 'Overdue')}
              value={stats.due || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter form */}
      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }} title={<Space><FilterOutlined />{t('records.filters', 'Filters')}</Space>} extra={<Button size="small" icon={<ClearOutlined />} onClick={handleClearFilters}>{t('records.clearFilters', 'Clear Filters')}</Button>}>
        <Form form={filterForm} layout="vertical" onFinish={handleFilter} initialValues={filters}>
          <Row gutter={[16, 0]}>
            <Col span={6} style={{ minWidth: 160 }}>
              <Form.Item name="problem_id" label={t('review.problemId', 'Problem ID')}>
                <Input placeholder={t('review.problemId', 'Enter Problem ID')} type="number" />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 160 }}>
              <Form.Item name="review_count" label={t('review.reviewCount', 'Review Count')}>
                <Input placeholder={t('review.reviewCount', 'Enter Review Count')} type="number" />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 180 }}>
              <Form.Item name="notification_status" label={t('review.notificationStatus', 'Notification Status')}>
                <Select placeholder={t('review.notificationStatus', 'Select Status')} allowClear options={notificationStatusOptions.map(opt => ({ ...opt, label: t(`review.status.${opt.value}`, opt.label) }))} />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 180 }}>
              <Form.Item name="notification_type" label={t('review.notificationType', 'Notification Type')}>
                <Select placeholder={t('review.notificationType', 'Select Type')} allowClear options={notificationTypeOptions.map(opt => ({ ...opt, label: t(`review.type.${opt.value}`, opt.label) }))} />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 220 }}>
              <Form.Item name="timeRange" label={t('review.nextReview', 'Next Review Date')}>
                <DatePicker.RangePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6} style={{ minWidth: 120, display: 'flex', alignItems: 'flex-end' }}>
              <Form.Item>
                <Button type="primary" htmlType="submit">{t('records.filter', 'Filter')}</Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
      {/* Batch operation buttons */}
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={handleBatchMark} disabled={!selectedRowKeys.length}>{t('review.batchMarkReviewed', 'Batch Mark Reviewed')}</Button>
        <Button onClick={handleBatchDelete} disabled={!selectedRowKeys.length}>{t('review.batchDelete', 'Batch Delete')}</Button>
      </Space>
      {/* All review records */}
      <Card title={t('review.allReviews', 'All Review Records')}>
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
            showTotal: (total, range) => t('records.pagination.showing', { start: range[0], end: range[1], total }),
          }}
          onChange={(pagination, filters, sorter) => {
            setPagination({ ...pagination, current: pagination.current, pageSize: pagination.pageSize });
            setSorter({ field: sorter.field || 'created_at', order: sorter.order || 'descend' });
          }}
        />
      </Card>

      {/* Edit review record modal */}
      <Modal
        title={t('review.editReview', 'Edit Review Record')}
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
