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
  RobotOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import recordsService from '../services/recordsService';
import dayjs from 'dayjs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
    default:
      return status;
  }
};

const RecordDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOutlined style={{ color: '#1890ff' }} />
          {t('records.viewRecord')}
          <Text code style={{ fontSize: '24px', fontWeight: 'normal' }}>#{record.id}</Text>
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left column - Main information */}
        <Col xs={24} lg={16}>
          {/* Problem information card */}
          <Card
            title={
              <Space>
                <BookOutlined style={{ color: '#1890ff' }} />
                {t('records.problemInfo')}
              </Space>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.problemTitle')}：</Text>
                  <Link href={record.submission_url} target="_blank" rel="noopener noreferrer">
                    {record.problem_title}
                  </Link>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.problemNumber')}：</Text>
                  <Button
                    type="link"
                    style={{ padding: 0, height: 'auto' }}
                    onClick={() => window.location.href = `/problem/${record.problem_number}`}
                  >
                    <Text code>{record.problem_number}</Text>
                  </Button>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.ojType')}：</Text>
                  <Tag color="blue">{record.oj_type}</Tag>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.language')}：</Text>
                  <Tag color="green">{record.language}</Tag>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.submitTime')}：</Text>
                  <Text>{dayjs(record.submit_time).format('YYYY-MM-DD HH:mm:ss')}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.executionResult')}：</Text>
                  <Tag
                    color={getStatusColor(record.execution_result)}
                    icon={getStatusIcon(record.execution_result)}
                  >
                    {getStatusText(record.execution_result, t)}
                  </Tag>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Judging information card */}
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                {t('records.judgingInfo')}
              </Space>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.runtime')}：</Text>
                  <Text>{record.runtime || '-'}</Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.memory')}：</Text>
                  <Text>{record.memory || '-'}</Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.runtimePercentile')}：</Text>
                  <Text>{record.runtime_percentile ? `${record.runtime_percentile}%` : '-'}</Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.memoryPercentile')}：</Text>
                  <Text>{record.memory_percentile ? `${record.memory_percentile}%` : '-'}</Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.totalCorrect')}：</Text>
                  <Text>{record.total_correct || '-'}</Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.totalTestcases')}：</Text>
                  <Text>{record.total_testcases || '-'}</Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Code card */}
          <Card
            title={
              <Space>
                <CodeOutlined style={{ color: '#722ed1' }} />
                {t('records.code')}
              </Space>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            <SyntaxHighlighter
              language={getLanguageForHighlight(record.language)}
              style={tomorrow}
              customStyle={{
                margin: 0,
                borderRadius: 6,
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            >
              {record.code || t('records.noCode')}
            </SyntaxHighlighter>
          </Card>

          {/* AI Analysis card */}
          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: '#faad14' }} />
                {t('records.aiAnalysis', 'AI Analysis')}
              </Space>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            {record.ai_analysis ? (
              <div style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiSummary', 'Summary')}：</Text>
                  <Text>{record.ai_analysis.summary}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiSolutionTypes', 'Solution Types')}：</Text>
                  <Text>{record.ai_analysis.solution_types?.join(', ') || '-'}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiTimeComplexity', 'Time Complexity')}：</Text>
                  <Text>{record.ai_analysis.time_complexity}</Text>
                  <Text strong style={{ marginLeft: 16 }}>{t('records.aiSpaceComplexity', 'Space Complexity')}：</Text>
                  <Text>{record.ai_analysis.space_complexity}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiAlgorithmType', 'Algorithm Type')}：</Text>
                  <Text>{record.ai_analysis.algorithm_type}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiCodeQualityScore', 'Code Quality Score')}：</Text>
                  <Text>{record.ai_analysis.code_quality_score}</Text>
                  <Text strong style={{ marginLeft: 16 }}>{t('records.aiStyleScore', 'Style Score')}：</Text>
                  <Text>{record.ai_analysis.style_score}</Text>
                  <Text strong style={{ marginLeft: 16 }}>{t('records.aiCorrectnessConfidence', 'Correctness Confidence')}：</Text>
                  <Text>{record.ai_analysis.correctness_confidence}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiStepAnalysis', 'Step Analysis')}：</Text>
                  <ul style={{ margin: 0, paddingLeft: 20, textAlign: 'left' }}>
                    {record.ai_analysis.step_analysis?.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiImprovementSuggestions', 'Improvement Suggestions')}：</Text>
                  <Text>{record.ai_analysis.improvement_suggestions}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiEdgeCasesCovered', 'Edge Cases Covered')}：</Text>
                  <Text>{record.ai_analysis.edge_cases_covered?.join(', ') || '-'}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiRelatedProblems', 'Related Problems')}：</Text>
                  <Text>{record.ai_analysis.related_problems?.join(', ') || '-'}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiRiskAreas', 'Risk Areas')}：</Text>
                  <Text>{record.ai_analysis.risk_areas?.join(', ') || '-'}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiLearningPoints', 'Learning Points')}：</Text>
                  <Text>{record.ai_analysis.learning_points?.join(', ') || '-'}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{t('records.aiModelVersion', 'Model Version')}：</Text>
                  <Text>{record.ai_analysis.model_version}</Text>
                </div>
              </div>
            ) : (
              <Text type="secondary">{t('records.noAIAnalysis', 'No AI analysis available')}</Text>
            )}
          </Card>

        </Col>

        {/* Right column - Sync status and other information */}
        <Col xs={24} lg={8}>
          {/* Sync status card */}
          <Card
            title={
              <Space>
                <SyncOutlined style={{ color: '#fa8c16' }} />
                {t('records.syncStatus')}
              </Space>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.ojSyncStatus')}：</Text>
                  <Tag
                    color={getStatusColor(record.oj_sync_status)}
                    icon={getStatusIcon(record.oj_sync_status)}
                  >
                    {getStatusText(record.oj_sync_status, t)}
                  </Tag>
                </div>
              </Col>
              <Col span={24}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.githubSyncStatus')}：</Text>
                  <Tag
                    color={getStatusColor(record.github_sync_status)}
                    icon={getStatusIcon(record.github_sync_status)}
                  >
                    {getStatusText(record.github_sync_status, t)}
                  </Tag>
                </div>
              </Col>
              <Col span={24}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.aiSyncStatus')}：</Text>
                  <Tag
                    color={getStatusColor(record.ai_sync_status)}
                    icon={getStatusIcon(record.ai_sync_status)}
                  >
                    {getStatusText(record.ai_sync_status, t)}
                  </Tag>
                </div>
              </Col>
              <Col span={24}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.notionSyncStatus')}：</Text>
                  <Tag
                    color={getStatusColor(record.notion_sync_status)}
                    icon={getStatusIcon(record.notion_sync_status)}
                  >
                    {getStatusText(record.notion_sync_status, t)}
                  </Tag>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Other information card */}
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#13c2c2' }} />
                {t('records.otherInfo')}
              </Space>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.submissionUrl')}：</Text>
                  {record.submission_url ? (
                    <Link href={record.submission_url} target="_blank" rel="noopener noreferrer">
                      <LinkOutlined /> {t('records.viewSubmission')}
                    </Link>
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </div>
              </Col>
              <Col span={24}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.gitFilePath')}：</Text>
                  {record.git_file_path ? (
                    <Link href={record.git_file_path} target="_blank" rel="noopener noreferrer">
                      <CloudOutlined /> {t('records.viewInGit')}
                    </Link>
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </div>
              </Col>
              <Col span={24}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.notionUrl')}：</Text>
                  {record.notion_url ? (
                    <Link href={record.notion_url} target="_blank" rel="noopener noreferrer">
                      <LinkOutlined /> {t('records.viewInNotion')}
                    </Link>
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </div>
              </Col>
            </Row>
          </Card>

          {/* Topic tags card */}
          {record.topic_tags && record.topic_tags.length > 0 && (
            <Card
              title={
                <Space>
                  <BookOutlined style={{ color: '#1890ff' }} />
                  {t('records.topicTags')}
                </Space>
              }
              size="small"
            >
              <div>
                {record.topic_tags.map((tag, index) => (
                  <Tag key={index} color="blue" style={{ marginBottom: 8 }}>
                    {tag}
                  </Tag>
                ))}
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default RecordDetail;
