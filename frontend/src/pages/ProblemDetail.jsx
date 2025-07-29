import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Typography, Spin, message, Space, Button, Divider } from 'antd';
import { 
  BookOutlined, 
  LinkOutlined, 
  ClockCircleOutlined,
  CodeOutlined,
  BarChartOutlined,
  FileTextOutlined,
  EyeOutlined,
  TagsOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import problemService from '../services/problemService';
import DataTable from '../components/common/DataTable';
import ProblemStatistics from '../components/problem/ProblemStatistics';
import {
  GradientPageHeader,
  ModernCard,
  ModernInfoItem,
  ModernTag,
  GRADIENT_THEMES
} from '../components/ui/ModernDesignSystem';

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

// Get difficulty translation
const getDifficultyText = (difficulty, t) => {
  if (!difficulty) return '-';
  const lowerDifficulty = difficulty.toLowerCase();
  switch (lowerDifficulty) {
    case 'easy':
      return t('problem.difficultyEasy');
    case 'medium':
      return t('problem.difficultyMedium');
    case 'hard':
      return t('problem.difficultyHard');
    default:
      return difficulty;
  }
};

const ProblemDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState(null);
  const [records, setRecords] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await problemService.getProblem(id);
      setProblem(data);
      // Get user related records and reviews
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
    { title: t('records.id', 'ID'), dataIndex: 'id', key: 'id' },
    { title: t('records.executionResult', 'Result'), dataIndex: 'execution_result', key: 'execution_result' },
    { title: t('records.language', 'Language'), dataIndex: 'language', key: 'language' },
    { title: t('records.submitTime', 'Submit Time'), dataIndex: 'submit_time', key: 'submit_time', render: (date) => date ? new Date(date).toLocaleString() : '-' },
    { title: t('common.actions', 'Actions'), key: 'actions', render: (_, record) => (
      <Button type="link" onClick={() => navigate(`/records/${record.id}`)}>{t('common.view', 'View')}</Button>
    ) },
  ];

  const reviewColumns = [
    { title: t('review.id', 'ID'), dataIndex: 'id', key: 'id' },
    { title: t('review.wrongReason', 'Wrong Reason'), dataIndex: 'wrong_reason', key: 'wrong_reason' },
    { title: t('review.reviewPlan', 'Review Plan'), dataIndex: 'review_plan', key: 'review_plan' },
    { title: t('review.nextReviewDate', 'Next Review'), dataIndex: 'next_review_date', key: 'next_review_date', render: (date) => date ? new Date(date).toLocaleString() : '-' },
    { title: t('review.reviewCount', 'Count'), dataIndex: 'review_count', key: 'review_count' },
    { title: t('common.actions', 'Actions'), key: 'actions', render: (_, review) => (
      <Button type="link" onClick={() => navigate(`/review/${review.id}`)}>{t('common.view', 'View')}</Button>
    ) },
  ];

  if (loading || !problem) {
    return <Spin style={{ margin: '40px auto', display: 'block' }} />;
  }

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: isMobile ? '16px' : '24px'
    }}>
      {/* Modern Page Header */}
      <GradientPageHeader
        icon={<ProfileOutlined style={{
          fontSize: isMobile ? '24px' : '36px',
          color: 'white'
        }} />}
        title={problem.title}
        subtitle={(
          <>
            <InfoCircleOutlined style={{ fontSize: isMobile ? '16px' : '20px' }} />
            {t('problem.detail', 'Problem Detail')} #{problem.id}
          </>
        )}
        isMobile={isMobile}
        gradient={GRADIENT_THEMES.info}
      />
      <Row gutter={isMobile ? [16, 16] : [24, 24]}>
        <Col xs={24}>
          <ModernCard
            title={t('problem.basicInfo', 'Basic Information')}
            icon={<BookOutlined />}
            iconGradient={GRADIENT_THEMES.primary}
            isMobile={isMobile}
          >
            <Row gutter={isMobile ? [16, 20] : [32, 24]}>
              <Col xs={24} md={12}>
                <ModernInfoItem
                  icon={<FileTextOutlined />}
                  label={t('problem.titleSlug', 'Title Slug')}
                  value={problem.title_slug || '-'}
                  iconGradient={GRADIENT_THEMES.info}
                  isMobile={isMobile}
                  valueComponent={
                    <div style={{
                      fontFamily: 'monospace',
                      background: '#f5f5f5',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}>
                      {problem.title_slug || '-'}
                    </div>
                  }
                />
                
                <ModernInfoItem
                  icon={<BarChartOutlined />}
                  label={t('problem.difficulty', 'Difficulty')}
                  iconGradient={GRADIENT_THEMES.warning}
                  isMobile={isMobile}
                  valueComponent={
                    <ModernTag 
                      type={problem.difficulty === 'Easy' ? 'success' : problem.difficulty === 'Hard' ? 'error' : 'warning'}
                      isMobile={isMobile}
                    >
                      {getDifficultyText(problem.difficulty, t)}
                    </ModernTag>
                  }
                />
                
                <ModernInfoItem
                  icon={<GlobalOutlined />}
                  label={t('problem.source', 'Source')}
                  iconGradient={GRADIENT_THEMES.cyan}
                  isMobile={isMobile}
                  valueComponent={
                    <ModernTag type="info" isMobile={isMobile}>
                      {problem.source}
                    </ModernTag>
                  }
                />
              </Col>
              
              <Col xs={24} md={12}>
                <ModernInfoItem
                  icon={<TagsOutlined />}
                  label={t('problem.tags', 'Tags')}
                  iconGradient={GRADIENT_THEMES.purple}
                  isMobile={isMobile}
                  valueComponent={
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {problem.tags && problem.tags.length > 0 
                        ? problem.tags.map(tag => (
                            <ModernTag key={tag} type="default" isMobile={isMobile}>
                              {tag}
                            </ModernTag>
                          ))
                        : <span style={{ color: '#9ca3af' }}>-</span>
                      }
                    </div>
                  }
                />
                
                <ModernInfoItem
                  icon={<LinkOutlined />}
                  label={t('problem.url', 'Problem URL')}
                  iconGradient={GRADIENT_THEMES.pink}
                  isMobile={isMobile}
                  valueComponent={
                    problem.url ? (
                      <a 
                        href={problem.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          color: GRADIENT_THEMES.pink.split(',')[0].split('(')[1],
                          fontWeight: 500,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <EyeOutlined />
                        {t('common.view')}
                      </a>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>-</span>
                    )
                  }
                />
              </Col>
            </Row>
            
            
            <div style={{ marginTop: isMobile ? 20 : 24 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 8 : 12,
                marginBottom: isMobile ? 12 : 16
              }}>
                <div style={{
                  width: isMobile ? '28px' : '32px',
                  height: isMobile ? '28px' : '32px',
                  borderRadius: isMobile ? '6px' : '8px',
                  background: 'linear-gradient(135deg, #64748b, #475569)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileTextOutlined style={{ 
                    color: 'white', 
                    fontSize: isMobile ? '14px' : '16px' 
                  }} />
                </div>
                <span style={{
                  fontSize: isMobile ? '15px' : '16px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  {t('problem.description', 'Description')}
                </span>
              </div>
              <div style={{
                fontSize: '15px',
                color: '#1f2937',
                lineHeight: '1.7',
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'left'
              }}>
                <div dangerouslySetInnerHTML={{ __html: problem.description || '<p>No description available</p>' }} />
              </div>
            </div>
          </ModernCard>
        </Col>
      </Row>
      
      {/* Statistics Section */}
      <ModernCard
        title={t('problem.statistics', 'Statistics')}
        icon={<BarChartOutlined />}
        iconGradient={GRADIENT_THEMES.success}
        isMobile={isMobile}
        style={{
          marginTop: isMobile ? 16 : 24
        }}
      >
        <ProblemStatistics problemId={id} />
      </ModernCard>


      
      <ModernCard
        title={t('problem.relatedRecords', 'Related Records')}
        icon={<HistoryOutlined />}
        iconGradient={GRADIENT_THEMES.success}
        isMobile={isMobile}
        style={{ marginTop: isMobile ? 24 : 40 }}
      >
        <DataTable
          data={records}
          columns={recordColumns}
          size={isMobile ? 'small' : 'middle'}
          pagination={false}
          showFilterButtons={false}
        />
      </ModernCard>
      
      <ModernCard
        title={t('problem.relatedReviews', 'Related Reviews')}
        icon={<ClockCircleOutlined />}
        iconGradient={GRADIENT_THEMES.warning}
        isMobile={isMobile}
        style={{ marginTop: isMobile ? 16 : 24 }}
      >
        <DataTable
          data={reviews}
          columns={reviewColumns}
          size={isMobile ? 'small' : 'middle'}
          pagination={false}
          showFilterButtons={false}
        />
      </ModernCard>
    </div>
  );
};

export default ProblemDetail;
