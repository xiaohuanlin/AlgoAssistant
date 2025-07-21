import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Typography, Spin, message, Space, Button } from 'antd';
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

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const detail = await reviewService.getReviewById(id);
        setReview(detail);
      } catch (error) {
        message.error('Failed to load review detail');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return <Spin spinning={true} style={{ width: '100%', marginTop: 100 }} />;
  }
  if (!review) {
    return <Card style={{ margin: 32 }}><Text type="danger">Failed to load review detail</Text></Card>;
  }

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/review')}>
          {t('common.back')}
        </Button>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOutlined style={{ color: '#1890ff' }} />
          {t('review.title')}
          <Text code style={{ fontSize: '24px', fontWeight: 'normal' }}>#{review.id}</Text>
        </Title>
      </div>
      <Row gutter={[24, 24]}>
        {/* Left column - Main info */}
        <Col xs={24} md={16}>
          <Card title={<Space><BookOutlined />{t('common.info') || 'Main Info'}</Space>} style={{ marginBottom: 24 }} size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}><Text strong>{t('records.problemId') || 'Problem ID'}:</Text> <Text>{review.problem_id}</Text></Col>
              <Col span={12}><Text strong>{t('common.id') || 'User ID'}:</Text> <Text>{review.user_id}</Text></Col>
              <Col span={24}><Text strong>{t('review.wrongReason')}:</Text> <Text>{review.wrong_reason || '-'}</Text></Col>
              <Col span={24}><Text strong>{t('review.reviewPlan')}:</Text> <Text>{review.review_plan || '-'}</Text></Col>
              <Col span={12}><Text strong>{t('review.reviewCount')}:</Text> <Tag color={review.review_count > 0 ? 'green' : 'default'}>{review.review_count}</Tag></Col>
              <Col span={12}><Text strong>{t('review.nextReview')}:</Text> <Text>{review.next_review_date ? dayjs(review.next_review_date).format('YYYY-MM-DD HH:mm') : '-'}</Text></Col>
            </Row>
          </Card>
        </Col>
        {/* Right column - Notification & meta info */}
        <Col xs={24} md={8}>
          <Card title={<Space><InfoCircleOutlined />{t('review.notification') || 'Notification'}</Space>} style={{ marginBottom: 24 }} size="small">
            <Row gutter={[8, 8]}>
              <Col span={24}><Text strong>{t('review.notificationStatus') || 'Status'}:</Text> <Tag color={getStatusColor(review.notification_status)}>{review.notification_status}</Tag></Col>
              <Col span={24}><Text strong>{t('review.notificationType') || 'Type'}:</Text> <Tag icon={getNotificationTypeIcon(review.notification_type)}>{review.notification_type}</Tag></Col>
              <Col span={24}><Text strong>{t('review.notificationSent') || 'Sent'}:</Text> <Tag color={review.notification_sent ? 'green' : 'default'}>{review.notification_sent ? t('common.yes') : t('common.no')}</Tag></Col>
              <Col span={24}><Text strong>{t('review.notificationSentAt') || 'Sent At'}:</Text> <Text>{review.notification_sent_at ? dayjs(review.notification_sent_at).format('YYYY-MM-DD HH:mm') : '-'}</Text></Col>
            </Row>
          </Card>
          <Card title={<Space><ClockCircleOutlined />{t('common.meta') || 'Meta'}</Space>} size="small">
            <Row gutter={[8, 8]}>
              <Col span={24}><Text strong>{t('common.createdAt') || 'Created At'}:</Text> <Text>{dayjs(review.created_at).format('YYYY-MM-DD HH:mm')}</Text></Col>
              <Col span={24}><Text strong>{t('common.updatedAt') || 'Updated At'}:</Text> <Text>{dayjs(review.updated_at).format('YYYY-MM-DD HH:mm')}</Text></Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReviewDetail;
