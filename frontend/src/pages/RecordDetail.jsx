import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Tag, Typography, Spin, message, Space } from 'antd';
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
  CloudOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import recordsService from '../services/recordsService';
import dayjs from 'dayjs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import AIAnalysisCard from '../components/AIAnalysisCard';

const { Title, Text, Link } = Typography;

const getLanguageForHighlight = (language) => {
  if (!language || typeof language !== 'string') return 'plaintext';
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

// 状态颜色映射
const getStatusColor = (status) => {
  if (!status) return 'default';
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

// 状态图标映射
const getStatusIcon = (status) => {
  if (!status) return null;
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

// 获取状态翻译文本
const getStatusText = (status, t) => {
  if (!status) return '-';
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
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOutlined style={{ color: '#1890ff' }} />
          {t('records.viewRecord')}
          <Text code style={{ fontSize: '24px', fontWeight: 'normal' }}>#{record.id}</Text>
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧列 - 主要信息 */}
        <Col xs={24} lg={16}>
          {/* 问题信息卡片 */}
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
                  <div style={{ marginTop: 4 }}>
                    <Link
                      href={record.submission_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1890ff', fontSize: '14px' }}
                    >
                      {record.problem_title}
                    </Link>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.problemNumber')}：</Text>
                  <Text code style={{ marginLeft: 8 }}>{record.problem_number || '-'}</Text>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.ojType')}：</Text>
                  <Tag color="blue" style={{ marginLeft: 8 }}>{record.oj_type}</Tag>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.language')}：</Text>
                  <Tag color="purple" style={{ marginLeft: 8 }}>{record.language}</Tag>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.submitTime')}：</Text>
                  <Text style={{ marginLeft: 8, fontFamily: 'monospace' }}>
                    {record.submit_time ? dayjs(record.submit_time).format('YYYY-MM-DD HH:mm') : '-'}
                  </Text>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.submissionId')}：</Text>
                  <Text code style={{ marginLeft: 8 }}>{record.submission_id || '-'}</Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 判题信息卡片 */}
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                {t('records.judgeInfo')}
              </Space>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.status')}：</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag
                      color={getStatusColor(record.execution_result)}
                      icon={getStatusIcon(record.execution_result)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      {getStatusText(record.execution_result, t)}
                    </Tag>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.totalTestcases')}：</Text>
                  <Text style={{ marginLeft: 8, fontFamily: 'monospace' }}>{record.total_testcases ?? '-'}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('records.totalCorrect')}：</Text>
                  <Text style={{ marginLeft: 8, fontFamily: 'monospace' }}>{record.total_correct ?? '-'}</Text>
                </div>
                {record.runtime && (
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>{t('records.runtime')}：</Text>
                    <Text style={{ marginLeft: 8, fontFamily: 'monospace' }}>{record.runtime}ms</Text>
                  </div>
                )}
                {record.memory && (
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>{t('records.memory')}：</Text>
                    <Text style={{ marginLeft: 8, fontFamily: 'monospace' }}>{record.memory}MB</Text>
                  </div>
                )}
              </Col>
            </Row>
          </Card>

          {/* 代码卡片 */}
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
            <div style={{
              borderRadius: 6,
              overflow: 'hidden',
              background: '#000000',
              border: '1px solid #333333'
            }}>
              <SyntaxHighlighter
                language={getLanguageForHighlight(record.language)}
                style={tomorrow}
                customStyle={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.5,
                  background: 'transparent'
                }}
              >
                {record.code || ''}
              </SyntaxHighlighter>
            </div>
          </Card>

          {/* AI分析卡片 */}
          {record.ai_analysis && (
            <AIAnalysisCard aiAnalysis={record.ai_analysis} />
          )}
        </Col>

        {/* 右侧列 - 同步状态和其他信息 */}
        <Col xs={24} lg={8}>
          {/* 同步状态卡片 */}
          <Card
            title={
              <Space>
                <SyncOutlined style={{ color: '#fa8c16' }} />
                {t('records.syncInfo')}
              </Space>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>{t('records.ojSyncStatus')}：</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag
                    color={getStatusColor(record.oj_sync_status)}
                    icon={getStatusIcon(record.oj_sync_status)}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    {getStatusText(record.oj_sync_status, t)}
                  </Tag>
                </div>
              </div>

              <div>
                <Text strong>{t('records.githubSyncStatus')}：</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag
                    color={getStatusColor(record.github_sync_status)}
                    icon={getStatusIcon(record.github_sync_status)}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    {getStatusText(record.github_sync_status, t)}
                  </Tag>
                </div>
              </div>

              <div>
                <Text strong>{t('records.aiSyncStatus')}：</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag
                    color={getStatusColor(record.ai_sync_status)}
                    icon={getStatusIcon(record.ai_sync_status)}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    {record.ai_sync_status ? getStatusText(record.ai_sync_status, t) : t('records.notAnalyzed')}
                  </Tag>
                </div>
              </div>

              {record.git_file_path && (
                <div>
                  <Text strong>{t('records.gitFilePath')}：</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                      {record.git_file_path}
                    </Text>
                  </div>
                </div>
              )}
            </Space>
          </Card>

          {/* 其他信息卡片 */}
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#52c41a' }} />
                {t('records.otherInfo')}
              </Space>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {record.notion_url && (
                <div>
                  <Text strong>{t('records.notionUrl')}：</Text>
                  <div style={{ marginTop: 4 }}>
                    <Link
                      href={record.notion_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1890ff', fontSize: '12px' }}
                    >
                      <LinkOutlined /> {t('records.viewInNotion')}
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <Text strong>{t('records.createdAt')}：</Text>
                <div style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                    {record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                  </Text>
                </div>
              </div>

              <div>
                <Text strong>{t('records.updatedAt')}：</Text>
                <div style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                    {record.updated_at ? dayjs(record.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
                  </Text>
                </div>
              </div>
            </Space>
          </Card>

          {/* 主题标签卡片 */}
          <Card
            title={
              <Space>
                <CloudOutlined style={{ color: '#1890ff' }} />
                {t('records.topicTags')}
              </Space>
            }
            size="small"
          >
            {record.topic_tags && Array.isArray(record.topic_tags) && record.topic_tags.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {record.topic_tags.map((tag, idx) => (
                  <Tag key={idx} color="blue" style={{ margin: 0, fontSize: '12px' }}>
                    {tag}
                  </Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: '12px' }}>-</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RecordDetail;
