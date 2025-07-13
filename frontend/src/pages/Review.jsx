import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
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
import reviewService from '../services/reviewService';

const { TextArea } = Input;

const Review = () => {
  const [reviews, setReviews] = useState([]);
  const [dueReviews, setDueReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reviewsData, dueReviewsData, statsData] = await Promise.all([
        reviewService.getReviews(),
        reviewService.getDueReviews(),
        reviewService.getReviewStats(),
      ]);
      setReviews(reviewsData);
      setDueReviews(dueReviewsData);
      setStats(statsData);
    } catch (error) {
      message.error('加载复习数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReviewed = async (reviewId) => {
    try {
      await reviewService.markAsReviewed(reviewId);
      message.success('复习完成！');
      loadData();
    } catch (error) {
      message.error('标记复习完成失败: ' + error.message);
    }
  };

  const handleEditReview = (review) => {
    form.setFieldsValue({
      wrong_reason: review.wrong_reason,
      review_plan: review.review_plan,
    });
    setModalVisible(true);
  };

  const handleSubmitEdit = async (values) => {
    try {
      // 这里需要后端提供更新复习记录的API
      message.success('复习记录更新成功！');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('更新复习记录失败: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const getReviewStatusColor = (review) => {
    const now = new Date();
    const nextReview = new Date(review.next_review_date);

    if (nextReview < now) {
      return 'error'; // 逾期
    } else if (nextReview.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'warning'; // 今天到期
    } else {
      return 'success'; // 正常
    }
  };

  const getReviewStatusText = (review) => {
    const now = new Date();
    const nextReview = new Date(review.next_review_date);

    if (nextReview < now) {
      return '逾期';
    } else if (nextReview.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return '今天到期';
    } else {
      return reviewService.formatReviewDate(review.next_review_date);
    }
  };

  const columns = [
    {
      title: '题目',
      dataIndex: ['record', 'problem_title'],
      key: 'problem_title',
      render: (title, record) => (
        <div>
          <div>{title}</div>
          <small style={{ color: '#666' }}>
            {record.record?.oj_type} - {record.record?.language}
          </small>
        </div>
      ),
    },
    {
      title: '错误原因',
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
      title: '复习计划',
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
      title: '复习次数',
      dataIndex: 'review_count',
      key: 'review_count',
      width: 100,
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'default'}>
          {count} 次
        </Tag>
      ),
    },
    {
      title: '下次复习',
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
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleMarkAsReviewed(record.id)}
          >
            完成复习
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditReview(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总复习数"
              value={stats.total || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待复习"
              value={stats.pending || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="逾期"
              value={stats.due || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 到期复习 */}
      {dueReviews.length > 0 && (
        <Card
          title="到期复习"
          style={{ marginBottom: 24 }}
          extra={
            <Tag color="error">
              {dueReviews.length} 个题目需要复习
            </Tag>
          }
        >
          <Table
            columns={columns}
            dataSource={dueReviews}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* 所有复习记录 */}
      <Card title="所有复习记录">
        <Table
          columns={columns}
          dataSource={reviews}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 编辑复习记录模态框 */}
      <Modal
        title="编辑复习记录"
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
            label="错误原因"
            name="wrong_reason"
            rules={[{ required: true, message: '请输入错误原因' }]}
          >
            <TextArea rows={3} placeholder="请描述为什么这道题做错了..." />
          </Form.Item>
          <Form.Item
            label="复习计划"
            name="review_plan"
            rules={[{ required: true, message: '请输入复习计划' }]}
          >
            <TextArea rows={4} placeholder="请制定具体的复习计划..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Review;
