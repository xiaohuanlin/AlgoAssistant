import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Typography, Spin, message, Space, Button, Table, Badge, Divider } from 'antd';
import { BookOutlined, ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import problemService from '../services/problemService';

const { Title, Text, Link, Paragraph } = Typography;

const difficultyColor = {
  Easy: 'green',
  Medium: 'orange',
  Hard: 'red',
};

const sourceColor = {
  leetcode: 'blue',
  custom: 'default',
};

const ProblemDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState(null);
  const [records, setRecords] = useState([]);
  const [reviews, setReviews] = useState([]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await problemService.getProblem(id);
      setProblem(data);
      // 获取用户相关 records 和 reviews
      const userData = await problemService.getProblemUserRecords(id);
      setRecords(userData.records || []);
      setReviews(userData.reviews || []);
    } catch (error) {
      message.error(t('problem.loadError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const recordColumns = [
    { title: t('record.id'), dataIndex: 'id', key: 'id' },
    { title: t('record.executionResult'), dataIndex: 'execution_result', key: 'execution_result' },
    { title: t('record.language'), dataIndex: 'language', key: 'language' },
    { title: t('record.submitTime'), dataIndex: 'submit_time', key: 'submit_time', render: (date) => date ? new Date(date).toLocaleString() : '-' },
    { title: t('record.actions'), key: 'actions', render: (_, record) => (
      <Button type="link" onClick={() => navigate(`/records/${record.id}`)}>{t('common.view')}</Button>
    ) },
  ];

  const reviewColumns = [
    { title: t('review.id'), dataIndex: 'id', key: 'id' },
    { title: t('review.wrongReason'), dataIndex: 'wrong_reason', key: 'wrong_reason' },
    { title: t('review.reviewPlan'), dataIndex: 'review_plan', key: 'review_plan' },
    { title: t('review.nextReviewDate'), dataIndex: 'next_review_date', key: 'next_review_date', render: (date) => date ? new Date(date).toLocaleString() : '-' },
    { title: t('review.reviewCount'), dataIndex: 'review_count', key: 'review_count' },
    { title: t('review.actions'), key: 'actions', render: (_, review) => (
      <Button type="link" onClick={() => navigate(`/review/${review.id}`)}>{t('common.view')}</Button>
    ) },
  ];

  if (loading || !problem) {
    return <Spin style={{ margin: '40px auto', display: 'block' }} />;
  }

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/problem')} />
        <Title level={2} style={{ margin: 0, flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <BookOutlined style={{ color: '#1890ff' }} />
          {problem.title}
        </Title>
      </div>
      <Card style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 8px #f0f1f2' }} bodyStyle={{ padding: 24 }}>
        <Row gutter={[24, 24]} align="top" justify="start">
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div>
                <Text type="secondary">{t('problem.titleSlug')}</Text>
                <div><Text code>{problem.title_slug || '-'}</Text></div>
              </div>
              <div>
                <Text type="secondary">{t('problem.difficulty')}</Text>
                <div>
                  <Tag color={difficultyColor[problem.difficulty] || 'default'} style={{ fontWeight: 500 }}>{problem.difficulty || '-'}</Tag>
                </div>
              </div>
              <div>
                <Text type="secondary">{t('problem.source')}</Text>
                <div>
                  <Tag color={sourceColor[problem.source] || 'default'} style={{ fontWeight: 500 }}>{problem.source}</Tag>
                </div>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div>
                <Text type="secondary">{t('problem.tags')}</Text>
                <div>{problem.tags && problem.tags.length > 0 ? problem.tags.map(tag => <Tag key={tag}>{tag}</Tag>) : '-'}</div>
              </div>
              <div>
                <Text type="secondary">{t('problem.url')}</Text>
                <div>
                  {problem.url ? (
                    <Link href={problem.url} target="_blank" rel="noopener noreferrer">
                      <LinkOutlined /> {problem.url}
                    </Link>
                  ) : '-'}
                </div>
              </div>
            </Space>
          </Col>
        </Row>
        <Divider style={{ margin: '24px 0 12px 0', textAlign: 'left' }}>{t('problem.description')}</Divider>
        <Row>
          <Col span={24}>
            <Paragraph style={{ marginTop: 0, marginBottom: 0, textAlign: 'left' }}>
              <span dangerouslySetInnerHTML={{ __html: problem.description || '-' }} />
            </Paragraph>
          </Col>
        </Row>
      </Card>
      <Card style={{ marginBottom: 24 }} size="small">
        <Title level={5}>{t('problem.relatedRecords')}</Title>
        <Table
          rowKey="id"
          columns={recordColumns}
          dataSource={records}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          tableLayout="fixed"
        />
      </Card>
      <Card size="small">
        <Title level={5}>{t('problem.relatedReviews')}</Title>
        <Table
          rowKey="id"
          columns={reviewColumns}
          dataSource={reviews}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          tableLayout="fixed"
        />
      </Card>
    </div>
  );
};

export default ProblemDetail;
