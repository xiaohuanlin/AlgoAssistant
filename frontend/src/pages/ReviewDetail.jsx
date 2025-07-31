import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Spin,
  message,
  Button,
  Table,
} from 'antd';
import {
  BookOutlined,
  MailOutlined,
  BellOutlined,
  MobileOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  CalendarOutlined,
  EditOutlined,
  CheckCircleOutlined,
  UserOutlined,
  HistoryOutlined,
  CodeOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import reviewService from '../services/reviewService';
import { useTranslation } from 'react-i18next';
import { formatLocalTime } from '../utils';
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
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await reviewService.getReviewById(id);
      setReview(detail);
    } catch (error) {
      message.error(t('review.loadError') || 'Failed to load review detail');
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return <Spin spinning={true} style={{ width: '100%', marginTop: 100 }} />;
  }
  if (!review) {
    return (
      <Card style={{ margin: 32 }}>
        <Text type="danger">
          {t('review.loadError') || 'Failed to load review detail'}
        </Text>
      </Card>
    );
  }

  const submissionColumns = [
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClockCircleOutlined style={{ color: '#8b5cf6' }} />
          {t('records.submitTime')}
        </div>
      ),
      dataIndex: 'submit_time',
      key: 'submit_time',
      render: (val) => (
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
          {formatLocalTime(val)}
        </span>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircleOutlined style={{ color: '#10b981' }} />
          {t('records.executionResult')}
        </div>
      ),
      dataIndex: 'execution_result',
      key: 'execution_result',
      render: (result) => (
        <Tag
          color={result === 'Accepted' ? 'success' : 'error'}
          style={{
            borderRadius: '8px',
            fontWeight: 500,
            border: 'none',
          }}
        >
          {result}
        </Tag>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CodeOutlined style={{ color: '#3b82f6' }} />
          {t('records.language')}
        </div>
      ),
      dataIndex: 'language',
      key: 'language',
      render: (language) => (
        <Tag
          style={{
            borderRadius: '8px',
            fontWeight: 500,
            background: '#e0f2fe',
            color: '#0369a1',
            border: 'none',
          }}
        >
          {language}
        </Tag>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOutlined style={{ color: '#f59e0b' }} />
          {t('records.ojType')}
        </div>
      ),
      dataIndex: 'oj_type',
      key: 'oj_type',
      render: (ojType) => (
        <Tag
          style={{
            borderRadius: '8px',
            fontWeight: 500,
            background: '#fef3c7',
            color: '#92400e',
            border: 'none',
          }}
        >
          {ojType}
        </Tag>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LinkOutlined style={{ color: '#ec4899' }} />
          {t('records.submissionUrl')}
        </div>
      ),
      dataIndex: 'submission_url',
      key: 'submission_url',
      render: (url) =>
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#ec4899',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <EyeOutlined />
            {t('common.view')}
          </a>
        ) : (
          <span style={{ color: '#9ca3af' }}>-</span>
        ),
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
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: isMobile ? '16px' : '24px',
      }}
    >
      {/* Page Header */}
      <div
        style={{
          marginBottom: isMobile ? 20 : 32,
          textAlign: 'center',
          background:
            'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          borderRadius: isMobile ? '12px' : '20px',
          padding: isMobile ? '24px 16px' : '48px 32px',
          color: 'white',
          boxShadow:
            '0 20px 40px rgba(99, 102, 241, 0.15), 0 10px 20px rgba(139, 92, 246, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: isMobile ? '120px' : '200px',
            height: isMobile ? '120px' : '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-10%',
            width: isMobile ? '100px' : '150px',
            height: isMobile ? '100px' : '150px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            filter: 'blur(30px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: isMobile ? '56px' : '80px',
              height: isMobile ? '56px' : '80px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: isMobile ? '14px' : '20px',
              marginBottom: isMobile ? '16px' : '24px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <EyeOutlined
              style={{
                fontSize: isMobile ? '24px' : '36px',
                color: 'white',
              }}
            />
          </div>

          <Title
            level={isMobile ? 3 : 1}
            style={{
              margin: 0,
              color: 'white',
              fontSize: isMobile ? '20px' : '32px',
              fontWeight: 700,
              marginBottom: isMobile ? '6px' : '8px',
              letterSpacing: '-0.5px',
              lineHeight: isMobile ? '1.4' : '1.2',
              paddingBottom: 0,
            }}
          >
            {review.problem_title || t('records.problemTitle')}
          </Title>

          <div
            style={{
              fontSize: isMobile ? '14px' : '18px',
              opacity: 0.9,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '6px' : '12px',
              flexWrap: 'wrap',
            }}
          >
            <HistoryOutlined style={{ fontSize: isMobile ? '16px' : '20px' }} />
            {t('review.title')} #{review.id}
          </div>
        </div>
      </div>
      <Row gutter={isMobile ? [16, 16] : [24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 12 : 16,
                }}
              >
                <div
                  style={{
                    width: isMobile ? '36px' : '40px',
                    height: isMobile ? '36px' : '40px',
                    borderRadius: isMobile ? '10px' : '12px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EditOutlined
                    style={{
                      color: 'white',
                      fontSize: isMobile ? '18px' : '20px',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: isMobile ? '18px' : '20px',
                    fontWeight: 600,
                    color: '#1f2937',
                  }}
                >
                  {t('review.title')}
                </span>
              </div>
            }
            style={{
              borderRadius: isMobile ? '12px' : '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              background: 'white',
            }}
            bodyStyle={{ padding: isMobile ? '20px' : '32px' }}
          >
            <Row gutter={isMobile ? [16, 20] : [32, 24]}>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: isMobile ? 20 : 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 10 : 12,
                      marginBottom: isMobile ? 10 : 12,
                    }}
                  >
                    <div
                      style={{
                        width: isMobile ? '28px' : '32px',
                        height: isMobile ? '28px' : '32px',
                        borderRadius: isMobile ? '6px' : '8px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircleOutlined
                        style={{
                          color: 'white',
                          fontSize: isMobile ? '14px' : '16px',
                        }}
                      />
                    </div>
                    <Text
                      strong
                      style={{
                        color: '#374151',
                        fontSize: isMobile ? '15px' : '16px',
                      }}
                    >
                      {t('review.reviewCount')}
                    </Text>
                  </div>
                  <div style={{ marginLeft: isMobile ? 38 : 44 }}>
                    <Tag
                      color={review.review_count > 0 ? 'success' : 'default'}
                      style={{
                        fontSize: isMobile ? '16px' : '18px',
                        padding: isMobile ? '6px 12px' : '8px 16px',
                        borderRadius: isMobile ? '8px' : '12px',
                        fontWeight: 600,
                        border: 'none',
                      }}
                    >
                      {review.review_count}
                    </Tag>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 12,
                      marginBottom: isMobile ? 8 : 12,
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CalendarOutlined
                        style={{ color: 'white', fontSize: '16px' }}
                      />
                    </div>
                    <Text strong style={{ color: '#374151', fontSize: '16px' }}>
                      {t('review.nextReview')}
                    </Text>
                  </div>
                  <div
                    style={{
                      marginLeft: 44,
                      fontSize: '16px',
                      color: '#1f2937',
                      fontWeight: 500,
                    }}
                  >
                    {formatLocalTime(review.next_review_date)}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 12,
                      marginBottom: isMobile ? 8 : 12,
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <EditOutlined
                        style={{ color: 'white', fontSize: '16px' }}
                      />
                    </div>
                    <Text strong style={{ color: '#374151', fontSize: '16px' }}>
                      {t('review.wrongReason')}
                    </Text>
                  </div>
                  <div
                    style={{
                      marginLeft: 44,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      fontSize: '15px',
                      color: '#1f2937',
                      lineHeight: '1.7',
                      background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {review.wrong_reason || '-'}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 12,
                      marginBottom: isMobile ? 8 : 12,
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BookOutlined
                        style={{ color: 'white', fontSize: '16px' }}
                      />
                    </div>
                    <Text strong style={{ color: '#374151', fontSize: '16px' }}>
                      {t('review.reviewPlan')}
                    </Text>
                  </div>
                  <div
                    style={{
                      marginLeft: 44,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      fontSize: '15px',
                      color: '#1f2937',
                      lineHeight: '1.7',
                      background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #bae6fd',
                    }}
                  >
                    {review.review_plan || '-'}
                  </div>
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 12,
                      marginBottom: isMobile ? 8 : 12,
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ClockCircleOutlined
                        style={{ color: 'white', fontSize: '16px' }}
                      />
                    </div>
                    <Text strong style={{ color: '#374151', fontSize: '16px' }}>
                      {t('common.createdAt')}
                    </Text>
                  </div>
                  <div
                    style={{
                      marginLeft: 44,
                      fontSize: '16px',
                      color: '#1f2937',
                      fontWeight: 500,
                    }}
                  >
                    {formatLocalTime(review.created_at)}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 12,
                      marginBottom: isMobile ? 8 : 12,
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <HistoryOutlined
                        style={{ color: 'white', fontSize: '16px' }}
                      />
                    </div>
                    <Text strong style={{ color: '#374151', fontSize: '16px' }}>
                      {t('common.updatedAt')}
                    </Text>
                  </div>
                  <div
                    style={{
                      marginLeft: 44,
                      fontSize: '16px',
                      color: '#1f2937',
                      fontWeight: 500,
                    }}
                  >
                    {formatLocalTime(review.updated_at)}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 12,
                      marginBottom: isMobile ? 8 : 12,
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #64748b, #475569)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UserOutlined
                        style={{ color: 'white', fontSize: '16px' }}
                      />
                    </div>
                    <Text strong style={{ color: '#374151', fontSize: '16px' }}>
                      {t('common.id')}
                    </Text>
                  </div>
                  <div
                    style={{
                      marginLeft: 44,
                      fontSize: '16px',
                      color: '#1f2937',
                      fontWeight: 500,
                    }}
                  >
                    {review.user_id}
                  </div>
                </div>
              </Col>
            </Row>
            <div
              style={{
                marginTop: 40,
                paddingTop: 32,
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center',
              }}
            >
              <Button
                type="primary"
                size="large"
                onClick={handleMarkReviewed}
                icon={<CheckCircleOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px 40px',
                  height: 'auto',
                  fontSize: '18px',
                  fontWeight: 600,
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {t('review.markAsReviewed')}
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 12 : 16,
                }}
              >
                <div
                  style={{
                    width: isMobile ? '36px' : '40px',
                    height: isMobile ? '36px' : '40px',
                    borderRadius: isMobile ? '10px' : '12px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BellOutlined
                    style={{
                      color: 'white',
                      fontSize: isMobile ? '18px' : '20px',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: isMobile ? '18px' : '20px',
                    fontWeight: 600,
                    color: '#1f2937',
                  }}
                >
                  {t('review.notification')}
                </span>
              </div>
            }
            style={{
              borderRadius: isMobile ? '12px' : '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              background: 'white',
            }}
            bodyStyle={{ padding: isMobile ? '20px' : '32px' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? 16 : 24,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 8 : 12,
                    marginBottom: isMobile ? 8 : 12,
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background:
                        getStatusColor(review.notification_status) === 'green'
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #64748b, #475569)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <InfoCircleOutlined
                      style={{ color: 'white', fontSize: '14px' }}
                    />
                  </div>
                  <Text
                    strong
                    style={{
                      color: '#374151',
                      fontSize: isMobile ? '14px' : '15px',
                    }}
                  >
                    {t('review.notificationStatus')}
                  </Text>
                </div>
                <div style={{ marginLeft: isMobile ? 32 : 40 }}>
                  <Tag
                    color={getStatusColor(review.notification_status)}
                    style={{
                      fontSize: '14px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      border: 'none',
                    }}
                  >
                    {t(
                      `review.status.${review.notification_status}`,
                      review.notification_status,
                    )}
                  </Tag>
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 8 : 12,
                    marginBottom: isMobile ? 8 : 12,
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getNotificationTypeIcon(review.notification_type)}
                  </div>
                  <Text
                    strong
                    style={{
                      color: '#374151',
                      fontSize: isMobile ? '14px' : '15px',
                    }}
                  >
                    {t('review.notificationType')}
                  </Text>
                </div>
                <div style={{ marginLeft: isMobile ? 32 : 40 }}>
                  <Tag
                    style={{
                      fontSize: '14px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      border: 'none',
                      background: '#e0f2fe',
                      color: '#0369a1',
                    }}
                  >
                    {t(
                      `review.type.${review.notification_type}`,
                      review.notification_type,
                    )}
                  </Tag>
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 8 : 12,
                    marginBottom: isMobile ? 8 : 12,
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: review.notification_sent
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #64748b, #475569)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleOutlined
                      style={{ color: 'white', fontSize: '14px' }}
                    />
                  </div>
                  <Text
                    strong
                    style={{
                      color: '#374151',
                      fontSize: isMobile ? '14px' : '15px',
                    }}
                  >
                    {t('review.notificationSent')}
                  </Text>
                </div>
                <div style={{ marginLeft: isMobile ? 32 : 40 }}>
                  <Tag
                    color={review.notification_sent ? 'success' : 'default'}
                    style={{
                      fontSize: '14px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      border: 'none',
                    }}
                  >
                    {review.notification_sent
                      ? t('common.yes')
                      : t('common.no')}
                  </Tag>
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 8 : 12,
                    marginBottom: isMobile ? 8 : 12,
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ClockCircleOutlined
                      style={{ color: 'white', fontSize: '14px' }}
                    />
                  </div>
                  <Text
                    strong
                    style={{
                      color: '#374151',
                      fontSize: isMobile ? '14px' : '15px',
                    }}
                  >
                    {t('review.notificationSentAt')}
                  </Text>
                </div>
                <div
                  style={{
                    marginLeft: isMobile ? 32 : 40,
                    fontSize: isMobile ? '14px' : '15px',
                    color: '#1f2937',
                    fontWeight: 500,
                  }}
                >
                  {formatLocalTime(review.notification_sent_at)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      <Card
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 12 : 16,
            }}
          >
            <div
              style={{
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                borderRadius: isMobile ? '10px' : '12px',
                background: 'linear-gradient(135deg, #ec4899, #be185d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CodeOutlined
                style={{ color: 'white', fontSize: isMobile ? '18px' : '20px' }}
              />
            </div>
            <span
              style={{
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: 600,
                color: '#1f2937',
              }}
            >
              {t('review.relatedRecords') || 'Related Submission Records'}
            </span>
          </div>
        }
        style={{
          marginTop: isMobile ? 24 : 40,
          borderRadius: isMobile ? '12px' : '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          background: 'white',
        }}
        bodyStyle={{ padding: isMobile ? '16px' : '32px' }}
      >
        <Table
          dataSource={review.submissions || []}
          columns={submissionColumns}
          rowKey="id"
          pagination={false}
          size={isMobile ? 'small' : 'middle'}
          scroll={isMobile ? { x: 800 } : undefined}
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        />
      </Card>
      <Modal
        open={showCreateRecordModal}
        onCancel={() => setShowCreateRecordModal(false)}
        footer={null}
        destroyOnClose
        width={isMobile ? '95%' : 800}
        style={{
          borderRadius: '12px',
          top: isMobile ? 20 : undefined,
        }}
        bodyStyle={{
          padding: isMobile ? '16px' : '24px',
        }}
      >
        <CreateRecord
          problemId={review.problem_id}
          onSuccess={handleRecordCreated}
        />
      </Modal>
    </div>
  );
};

export default ReviewDetail;
