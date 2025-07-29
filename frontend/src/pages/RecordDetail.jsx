import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Tag, Typography, Spin, message, Space, Button } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  CodeOutlined,
  BookOutlined,
  LinkOutlined,
  FileTextOutlined,
  CloudOutlined,
  RobotOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  BugOutlined,
  TagsOutlined,
  GithubOutlined,
  ApiOutlined,
  ProfileOutlined,
  GlobalOutlined,
  InteractionOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import recordsService from '../services/recordsService';
import dayjs from 'dayjs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  GradientPageHeader,
  ModernCard,
  ModernInfoItem,
  ModernTag,
  GRADIENT_THEMES
} from '../components/ui/ModernDesignSystem';

const { Title, Text, Link } = Typography;

const getLanguageForHighlight = (language) => {
  const lower = language.toLowerCase();
  if (lower.includes('python')) return 'python';
  if (lower.includes('java')) return 'java';
  if (lower.includes('cpp')) return 'cpp';
  if (lower.includes('c')) return 'c';
  if (lower.includes('javascript')) return 'javascript';
  if (lower.includes('typescript')) return 'typescript';
  if (lower.includes('go')) return 'go';
  if (lower.includes('rust')) return 'rust';
  return 'plaintext';
};

const formatValue = (value, unit, t) => {
  if (!value || value === '-') return '-';

  // If value already contains unit, return as is
  if (typeof value === 'string' && (value.includes('ms') || value.includes('MB') || value.includes('KB'))) {
    return value;
  }

  // If value is a number, add default unit
  if (typeof value === 'number' || !isNaN(Number(value))) {
    return `${value} ${unit}`;
  }

  return value;
};

// Status color mapping
const getStatusColor = (status) => {
  const lowerStatus = status.toLowerCase();
  switch (lowerStatus) {
    case 'accepted':
      return 'success';
    case 'wrong answer':
    case 'wrong_answer':
      return 'error';
    case 'time limit exceeded':
    case 'time_limit_exceeded':
      return 'warning';
    case 'runtime error':
    case 'runtime_error':
      return 'error';
    case 'memory limit exceeded':
    case 'memory_limit_exceeded':
      return 'warning';
    case 'compile error':
    case 'compile_error':
      return 'error';
    case 'pending':
      return 'processing';
    case 'syncing':
      return 'processing';
    case 'synced':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

// Status icon mapping
const getStatusIcon = (status) => {
  const lowerStatus = status.toLowerCase();
  switch (lowerStatus) {
    case 'accepted':
    case 'synced':
      return <CheckCircleOutlined />;
    case 'wrong answer':
    case 'wrong_answer':
    case 'runtime error':
    case 'runtime_error':
    case 'compile error':
    case 'compile_error':
    case 'failed':
      return <CloseCircleOutlined />;
    case 'time limit exceeded':
    case 'time_limit_exceeded':
    case 'memory limit exceeded':
    case 'memory_limit_exceeded':
      return <ExclamationCircleOutlined />;
    case 'pending':
    case 'syncing':
      return <ClockCircleOutlined />;
    default:
      return null;
  }
};

// Get status color and theme mapping
const getStatusTheme = (status) => {
  const lowerStatus = status?.toLowerCase();
  switch (lowerStatus) {
    case 'synced':
    case 'accepted':
    case 'completed':
      return {
        gradient: GRADIENT_THEMES.success,
        tagType: 'success'
      };
    case 'pending':
    case 'syncing':
      return {
        gradient: GRADIENT_THEMES.warning,
        tagType: 'warning'
      };
    case 'failed':
    case 'wrong answer':
    case 'wrong_answer':
    case 'runtime error':
    case 'runtime_error':
    case 'compile error':
    case 'compile_error':
      return {
        gradient: GRADIENT_THEMES.error,
        tagType: 'error'
      };
    case 'paused':
    case 'retry':
      return {
        gradient: GRADIENT_THEMES.slate,
        tagType: 'default'
      };
    default:
      return {
        gradient: GRADIENT_THEMES.slate,
        tagType: 'default'
      };
  }
};

// Get status translation text
const getStatusText = (status, t) => {
  const lowerStatus = status.toLowerCase();
  switch (lowerStatus) {
    case 'accepted':
      return t('records.statusAccepted');
    case 'wrong answer':
    case 'wrong_answer':
      return t('records.statusWrongAnswer');
    case 'time limit exceeded':
    case 'time_limit_exceeded':
      return t('records.statusTimeLimitExceeded');
    case 'memory limit exceeded':
    case 'memory_limit_exceeded':
      return t('records.statusMemoryLimitExceeded');
    case 'runtime error':
    case 'runtime_error':
      return t('records.statusRuntimeError');
    case 'compile error':
    case 'compile_error':
      return t('records.statusCompileError');
    case 'pending':
      return t('records.statusPending');
    case 'completed':
      return t('records.statusCompleted');
    case 'synced':
      return t('records.statusSynced');
    case 'syncing':
      return t('records.statusSyncing');
    case 'failed':
      return t('records.statusFailed');
    case 'paused':
      return t('records.statusPaused');
    case 'retry':
      return t('records.statusRetry');
    case 'other':
      return t('common.other');
    default:
      return status;
  }
};

// Get OJ type translation text
const getOjTypeText = (ojType, t) => {
  const lowerOjType = ojType?.toLowerCase();
  switch (lowerOjType) {
    case 'leetcode':
      return 'LeetCode';
    case 'other':
      return t('common.other');
    default:
      return ojType || t('common.unknown');
  }
};

// Check if URL is valid
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#' || trimmed === '-') return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
};

const RecordDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const detail = await recordsService.getRecord(id);
        setRecord(detail);
      } catch (error) {
        message.error(t('records.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, t]);

  if (loading) {
    return <Spin spinning={true} style={{ width: '100%', marginTop: 100 }} />;
  }
  if (!record) {
    return <Card style={{ margin: 32 }}><Text type="danger">{t('records.loadError')}</Text></Card>;
  }

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: isMobile ? '16px' : '24px'
    }}>
      {/* Modern Page Header */}
      <GradientPageHeader
        icon={<CodeOutlined style={{
          fontSize: isMobile ? '24px' : '36px',
          color: 'white'
        }} />}
        title={`${record.problem_title || t('records.problemTitle')}`}
        subtitle={(
          <>
            <HistoryOutlined style={{ fontSize: isMobile ? '16px' : '20px' }} />
            {t('records.viewRecord')} #{record.id}
          </>
        )}
        isMobile={isMobile}
        gradient={GRADIENT_THEMES.success}
      />

      <Row gutter={isMobile ? [16, 16] : [24, 24]}>
        {/* Left column - Main information */}
        <Col xs={24} lg={16}>
          {/* Problem information card */}
          <ModernCard
            title={t('records.problemInfo')}
            icon={<BookOutlined />}
            iconGradient={GRADIENT_THEMES.primary}
            isMobile={isMobile}
          >
            <Row gutter={isMobile ? [16, 20] : [32, 24]}>
              <Col xs={24} md={12}>
                <ModernInfoItem
                  icon={<ProfileOutlined />}
                  label={t('records.problemTitle')}
                  iconGradient={GRADIENT_THEMES.primary}
                  isMobile={isMobile}
                  valueComponent={
                    record.problem_number ? (
                      <Button
                        type="link"
                        style={{ 
                          padding: 0, 
                          height: 'auto',
                          color: GRADIENT_THEMES.primary.split(',')[0].split('(')[1],
                          fontWeight: 500
                        }}
                        onClick={() => window.location.href = `/problem/${record.problem_number}`}
                      >
                        <EyeOutlined style={{ marginRight: 6 }} />
                        {record.problem_title}
                      </Button>
                    ) : (
                      <span>{record.problem_title}</span>
                    )
                  }
                />
                
                <ModernInfoItem
                  icon={<GlobalOutlined />}
                  label={t('records.ojType')}
                  iconGradient={GRADIENT_THEMES.info}
                  isMobile={isMobile}
                  valueComponent={
                    <ModernTag type="info" isMobile={isMobile}>
                      {getOjTypeText(record.oj_type, t)}
                    </ModernTag>
                  }
                />
                
                <ModernInfoItem
                  icon={<ClockCircleOutlined />}
                  label={t('records.submitTime')}
                  value={dayjs(record.submit_time).format('YYYY-MM-DD HH:mm:ss')}
                  iconGradient={GRADIENT_THEMES.purple}
                  isMobile={isMobile}
                />
              </Col>
              
              <Col xs={24} md={12}>
                <ModernInfoItem
                  icon={<ProjectOutlined />}
                  label={t('records.problemNumber')}
                  iconGradient={GRADIENT_THEMES.slate}
                  isMobile={isMobile}
                  valueComponent={
                    <Button
                      type="link"
                      style={{ 
                        padding: 0, 
                        height: 'auto',
                        fontFamily: 'monospace',
                        background: '#f5f5f5',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                      onClick={() => window.location.href = `/problem/${record.problem_number}`}
                    >
                      #{record.problem_number}
                    </Button>
                  }
                />
                
                <ModernInfoItem
                  icon={<CodeOutlined />}
                  label={t('records.language')}
                  iconGradient={GRADIENT_THEMES.success}
                  isMobile={isMobile}
                  valueComponent={
                    <ModernTag type="success" isMobile={isMobile}>
                      {record.language}
                    </ModernTag>
                  }
                />
                
                <ModernInfoItem
                  icon={<CheckCircleOutlined />}
                  label={t('records.executionResult')}
                  iconGradient={getStatusTheme(record.execution_result).gradient}
                  isMobile={isMobile}
                  valueComponent={
                    <ModernTag 
                      type={getStatusTheme(record.execution_result).tagType}
                      isMobile={isMobile}
                    >
                      {getStatusIcon(record.execution_result)}
                      <span style={{ marginLeft: 6 }}>
                        {getStatusText(record.execution_result, t)}
                      </span>
                    </ModernTag>
                  }
                />
              </Col>
            </Row>
          </ModernCard>

          {/* Judging information card */}
          <ModernCard
            title={t('records.judgingInfo')}
            icon={<ThunderboltOutlined />}
            iconGradient={GRADIENT_THEMES.warning}
            isMobile={isMobile}
          >
            <Row gutter={isMobile ? [16, 20] : [32, 24]}>
              <Col xs={24} md={12}>
                <ModernInfoItem
                  icon={<ThunderboltOutlined />}
                  label={t('records.runtime')}
                  value={formatValue(record.runtime, 'ms', t)}
                  iconGradient={GRADIENT_THEMES.warning}
                  isMobile={isMobile}
                />
                
                <ModernInfoItem
                  icon={<InteractionOutlined />}
                  label={t('records.runtimePercentile')}
                  value={record.runtime_percentile ? `${record.runtime_percentile}%` : '-'}
                  iconGradient={GRADIENT_THEMES.success}
                  isMobile={isMobile}
                />
                
                <ModernInfoItem
                  icon={<CheckCircleOutlined />}
                  label={t('records.totalCorrect')}
                  value={record.total_correct || '-'}
                  iconGradient={GRADIENT_THEMES.success}
                  isMobile={isMobile}
                />
              </Col>
              
              <Col xs={24} md={12}>
                <ModernInfoItem
                  icon={<DatabaseOutlined />}
                  label={t('records.memory')}
                  value={formatValue(record.memory, 'MB', t)}
                  iconGradient={GRADIENT_THEMES.info}
                  isMobile={isMobile}
                />
                
                <ModernInfoItem
                  icon={<InteractionOutlined />}
                  label={t('records.memoryPercentile')}
                  value={record.memory_percentile ? `${record.memory_percentile}%` : '-'}
                  iconGradient={GRADIENT_THEMES.cyan}
                  isMobile={isMobile}
                />
                
                <ModernInfoItem
                  icon={<BugOutlined />}
                  label={t('records.totalTestcases')}
                  value={record.total_testcases || '-'}
                  iconGradient={GRADIENT_THEMES.slate}
                  isMobile={isMobile}
                />
              </Col>
            </Row>
          </ModernCard>

          {/* Code card */}
          <ModernCard
            title={t('records.code')}
            icon={<CodeOutlined />}
            iconGradient={GRADIENT_THEMES.purple}
            isMobile={isMobile}
          >
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <SyntaxHighlighter
                language={getLanguageForHighlight(record.language)}
                style={tomorrow}
                customStyle={{
                  margin: 0,
                  borderRadius: 8,
                  fontSize: isMobile ? '12px' : '14px',
                  lineHeight: '1.5'
                }}
              >
                {record.code || t('records.noCodeAvailable')}
              </SyntaxHighlighter>
            </div>
          </ModernCard>

          {/* AI Analysis card */}
          <ModernCard
            title={t('records.aiAnalysis', 'AI Analysis')}
            icon={<RobotOutlined />}
            iconGradient={GRADIENT_THEMES.warning}
            isMobile={isMobile}
          >
            {record.ai_analysis ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
                <div style={{
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #f59e0b20'
                }}>
                  <Text strong style={{ color: '#92400e' }}>{t('records.aiSummary', 'Summary')}: </Text>
                  <Text style={{ color: '#451a03' }}>{record.ai_analysis.summary}</Text>
                </div>
                
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <Text strong>{t('records.aiTimeComplexity', 'Time')}: </Text>
                    <ModernTag type="warning" isMobile={isMobile}>
                      {record.ai_analysis.time_complexity}
                    </ModernTag>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong>{t('records.aiSpaceComplexity', 'Space')}: </Text>
                    <ModernTag type="info" isMobile={isMobile}>
                      {record.ai_analysis.space_complexity}
                    </ModernTag>
                  </Col>
                </Row>
                
                <div>
                  <Text strong>{t('records.aiAlgorithmType', 'Algorithm')}: </Text>
                  <ModernTag type="default" isMobile={isMobile}>
                    {record.ai_analysis.algorithm_type}
                  </ModernTag>
                </div>
                
                <div>
                  <Text strong>{t('records.aiSolutionTypes', 'Solution Types')}: </Text>
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {record.ai_analysis.solution_types?.map((type, idx) => (
                      <ModernTag key={idx} type="info" isMobile={isMobile}>
                        {type}
                      </ModernTag>
                    )) || '-'}
                  </div>
                </div>
                
                {record.ai_analysis.step_analysis && record.ai_analysis.step_analysis.length > 0 && (
                  <div>
                    <Text strong>{t('records.aiStepAnalysis', 'Step Analysis')}:</Text>
                    <div style={{
                      marginTop: 8,
                      background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #bae6fd'
                    }}>
                      <ol style={{ margin: 0, paddingLeft: 20, color: '#0369a1' }}>
                        {record.ai_analysis.step_analysis.map((step, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
                
                {record.ai_analysis.improvement_suggestions && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <Text strong style={{ color: '#166534' }}>{t('records.aiImprovementSuggestions', 'Improvements')}: </Text>
                    <Text style={{ color: '#15803d' }}>{record.ai_analysis.improvement_suggestions}</Text>
                  </div>
                )}
              </div>
            ) : (
              <Text type="secondary">{t('records.noAIAnalysis')}</Text>
            )}
          </ModernCard>

        </Col>

        {/* Right column - Sync status and other information */}
        <Col xs={24} lg={8}>
          {/* Sync status card */}
          <ModernCard
            title={t('records.syncStatus')}
            icon={<SyncOutlined />}
            iconGradient={GRADIENT_THEMES.warning}
            isMobile={isMobile}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
              <ModernInfoItem
                icon={<ApiOutlined />}
                label={t('records.ojSyncStatus')}
                iconGradient={getStatusTheme(record.oj_sync_status).gradient}
                isMobile={isMobile}
                valueComponent={
                  <ModernTag 
                    type={getStatusTheme(record.oj_sync_status).tagType}
                    isMobile={isMobile}
                  >
                    {getStatusIcon(record.oj_sync_status)}
                    <span style={{ marginLeft: 6 }}>
                      {getStatusText(record.oj_sync_status, t)}
                    </span>
                  </ModernTag>
                }
              />
              
              <ModernInfoItem
                icon={<GithubOutlined />}
                label={t('records.githubSyncStatus')}
                iconGradient={getStatusTheme(record.github_sync_status).gradient}
                isMobile={isMobile}
                valueComponent={
                  <ModernTag 
                    type={getStatusTheme(record.github_sync_status).tagType}
                    isMobile={isMobile}
                  >
                    {getStatusIcon(record.github_sync_status)}
                    <span style={{ marginLeft: 6 }}>
                      {getStatusText(record.github_sync_status, t)}
                    </span>
                  </ModernTag>
                }
              />
              
              <ModernInfoItem
                icon={<RobotOutlined />}
                label={t('records.aiSyncStatus')}
                iconGradient={getStatusTheme(record.ai_sync_status).gradient}
                isMobile={isMobile}
                valueComponent={
                  <ModernTag 
                    type={getStatusTheme(record.ai_sync_status).tagType}
                    isMobile={isMobile}
                  >
                    {getStatusIcon(record.ai_sync_status)}
                    <span style={{ marginLeft: 6 }}>
                      {getStatusText(record.ai_sync_status, t)}
                    </span>
                  </ModernTag>
                }
              />
              
              <ModernInfoItem
                icon={<FileTextOutlined />}
                label={t('records.notionSyncStatus')}
                iconGradient={getStatusTheme(record.notion_sync_status).gradient}
                isMobile={isMobile}
                valueComponent={
                  <ModernTag 
                    type={getStatusTheme(record.notion_sync_status).tagType}
                    isMobile={isMobile}
                  >
                    {getStatusIcon(record.notion_sync_status)}
                    <span style={{ marginLeft: 6 }}>
                      {getStatusText(record.notion_sync_status, t)}
                    </span>
                  </ModernTag>
                }
              />
            </div>
          </ModernCard>

          {/* Other information card */}
          <ModernCard
            title={t('records.otherInfo')}
            icon={<LinkOutlined />}
            iconGradient={GRADIENT_THEMES.cyan}
            isMobile={isMobile}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
              <ModernInfoItem
                icon={<LinkOutlined />}
                label={t('records.submissionUrl')}
                iconGradient={GRADIENT_THEMES.pink}
                isMobile={isMobile}
                valueComponent={
                  isValidUrl(record.submission_url) ? (
                    <a 
                      href={record.submission_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: '#ec4899',
                        fontWeight: 500,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <EyeOutlined />
                      {t('records.viewSubmission')}
                    </a>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>-</span>
                  )
                }
              />
              
              <ModernInfoItem
                icon={<CloudOutlined />}
                label={t('records.gitFilePath')}
                iconGradient={GRADIENT_THEMES.slate}
                isMobile={isMobile}
                valueComponent={
                  isValidUrl(record.git_file_path) ? (
                    <a 
                      href={record.git_file_path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: '#64748b',
                        fontWeight: 500,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <EyeOutlined />
                      {t('records.viewInGit')}
                    </a>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>-</span>
                  )
                }
              />
              
              <ModernInfoItem
                icon={<FileTextOutlined />}
                label={t('records.notionUrl')}
                iconGradient={GRADIENT_THEMES.info}
                isMobile={isMobile}
                valueComponent={
                  isValidUrl(record.notion_url) ? (
                    <a 
                      href={record.notion_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: '#3b82f6',
                        fontWeight: 500,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <EyeOutlined />
                      {t('records.viewInNotion')}
                    </a>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>-</span>
                  )
                }
              />
            </div>
          </ModernCard>

          {/* Topic tags card */}
          {record.topic_tags && record.topic_tags.length > 0 && (
            <ModernCard
              title={t('records.topicTags')}
              icon={<TagsOutlined />}
              iconGradient={GRADIENT_THEMES.primary}
              isMobile={isMobile}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 6 : 8 }}>
                {record.topic_tags.map((tag, index) => (
                  <ModernTag key={index} type="info" isMobile={isMobile}>
                    {tag}
                  </ModernTag>
                ))}
              </div>
            </ModernCard>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default RecordDetail;
