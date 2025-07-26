import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Typography, Spin, message, Space, Button, Table } from 'antd';
import {
  BookOutlined,
  ArrowLeftOutlined,
  MailOutlined,
  BellOutlined,
  MobileOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import reviewService from '../services/reviewService';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import CreateRecord from './CreateRecord';
import { Modal } from 'antd';

const { Title, Text } = Typography;

const getNotificationTypeIcon = (type) => {
  switch (type) {
    case 'email':
      return <MailOutlined />;
    case 'push':
      return <BellOutlined />;
    case 'sms':
      return <MobileOutlined />;
    default:
      return <InfoCircleOutlined />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'sent':
      return 'green';
    case 'failed':
      return 'red';
    case 'pending':
    default:
      return 'default';
  }
};

const ReviewDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const detail = await reviewService.getReviewById(id);
      setReview(detail);
    } catch (error) {
      message.error(t('review.loadError') || 'Failed to load review detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return <Spin spinning={true} style={{ width: '100%', marginTop: 100 }} />;
  }
  if (!review) {
    return <Card style={{ margin: 32 }}><Text type="danger">{t('review.loadError') || 'Failed to load review detail'}</Text></Card>;
  }

  const submissionColumns = [
    {
      title: t('records.submitTime'),
      dataIndex: 'submit_time',
      key: 'submit_time',
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('records.executionResult'),
      dataIndex: 'execution_result',
      key: 'execution_result',
    },
    {
      title: t('records.language'),
      dataIndex: 'language',
      key: 'language',
    },
    {
      title: t('records.ojType'),
      dataIndex: 'oj_type',
      key: 'oj_type',
    },
    {
      title: t('records.submissionUrl'),
      dataIndex: 'submission_url',
      key: 'submission_url',
      render: (url) => url ? <a href={url} target="_blank" rel="noopener noreferrer">{t('common.view')}</a> : '-',
    },
  ];

  const handleMarkReviewed = () => {
    setShowCreateRecordModal(true);
  };

  const handleRecordCreated = async () => {
    try {
      await reviewService.markAsReviewed(review.id);
      await fetchDetail();
      message.success(t('review.markAsReviewedSuccess'));
    } catch (e) {
      message.error(t('review.markReviewFailed'));
    } finally {
      setShowCreateRecordModal(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/review')}>
          {t('common.back')}
        </Button>
        <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOutlined style={{ color: '#1890ff' }} />
          {review.problem_title || t('records.problemTitle')}
        </Title>
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card
            title={<Space><BookOutlined />{t('review.title')}</Space>}
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('review.reviewCount')}:</Text> <Tag color={review.review_count > 0 ? 'green' : 'default'}>{review.review_count}</Tag>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('review.nextReview')}:</Text> <Text>{review.next_review_date ? dayjs(review.next_review_date).format('YYYY-MM-DD HH:mm') : '-'}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('review.wrongReason')}:</Text>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{review.wrong_reason || '-'}</div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('review.reviewPlan')}:</Text>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{review.review_plan || '-'}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('common.createdAt')}:</Text> <Text>{dayjs(review.created_at).format('YYYY-MM-DD HH:mm')}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('common.updatedAt')}:</Text> <Text>{dayjs(review.updated_at).format('YYYY-MM-DD HH:mm')}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('common.id')}:</Text> <Text>{review.user_id}</Text>
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <Button type="primary" onClick={handleMarkReviewed}>
                {t('review.markAsReviewed')}
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<Space><InfoCircleOutlined />{t('review.notification')}</Space>} style={{ marginBottom: 24 }} size="small">
            <Row gutter={[8, 8]}>
              <Col span={24}><Text strong>{t('review.notificationStatus')}:</Text> <Tag color={getStatusColor(review.notification_status)}>{review.notification_status}</Tag></Col>
              <Col span={24}><Text strong>{t('review.notificationType')}:</Text> <Tag icon={getNotificationTypeIcon(review.notification_type)}>{review.notification_type}</Tag></Col>
              <Col span={24}><Text strong>{t('review.notificationSent')}:</Text> <Tag color={review.notification_sent ? 'green' : 'default'}>{review.notification_sent ? t('common.yes') : t('common.no')}</Tag></Col>
              <Col span={24}><Text strong>{t('review.notificationSentAt')}:</Text> <Text>{review.notification_sent_at ? dayjs(review.notification_sent_at).format('YYYY-MM-DD HH:mm') : '-'}</Text></Col>
            </Row>
          </Card>
        </Col>
      </Row>
      <Card title={t('review.relatedRecords') || 'Related Submission Records'} style={{ marginTop: 32 }}>
        <Table
          dataSource={review.submissions || []}
          columns={submissionColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
      <Modal open={showCreateRecordModal} onCancel={() => setShowCreateRecordModal(false)} footer={null} destroyOnClose>
        <CreateRecord problemId={review.problem_id} onSuccess={handleRecordCreated} />
      </Modal>
    </div>
  );
};

export default ReviewDetail;
