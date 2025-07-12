import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  message,
  Spin,
  Tag,
  Typography,
  Space,
  Modal,
  Row,
  Col,
  Statistic,
  Tooltip
} from 'antd';
import {
  BookOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import recordsService from '../services/recordsService';
import dayjs from 'dayjs';

const { Title, Text, Link } = Typography;

const Records = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading records...');
      console.log('Current token:', localStorage.getItem('token'));
      
      const [recordsData, statsData] = await Promise.all([
        recordsService.getRecords(),
        recordsService.getStats()
      ]);
      console.log('Records data:', recordsData);
      console.log('Stats data:', statsData);
      
      // Ensure we have valid arrays/objects
      const validRecords = Array.isArray(recordsData) ? recordsData : [];
      const validStats = statsData && typeof statsData === 'object' ? statsData : {};
      
      console.log('Valid records:', validRecords);
      console.log('Valid stats:', validStats);
      
      setRecords(validRecords);
      setStats(validStats);
    } catch (error) {
      console.error('Error loading records:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        message.error('Authentication required. Please login again.');
        // Redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        message.error(t('records.loadError'));
      }
      
      setRecords([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const statsData = await recordsService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    // Add error boundary for debugging
    const handleError = (error) => {
      console.error('Global error caught:', error);
      console.error('Error stack:', error.stack);
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleViewRecord = (record) => {
    if (!record) {
      message.error('Invalid record');
      return;
    }
    setCurrentRecord(record);
    setViewModalVisible(true);
  };

  const getStatusColor = (status) => {
    if (!status || typeof status !== 'string') return 'default';
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'success';
      case 'wrong answer':
        return 'error';
      case 'time limit exceeded':
        return 'warning';
      case 'runtime error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLanguageColor = (language) => {
    if (!language || typeof language !== 'string') return 'default';
    const lowerLanguage = language.toLowerCase();
    const colors = {
      'python': 'blue',
      'java': 'orange',
      'cpp': 'purple',
      'c': 'cyan',
      'javascript': 'yellow',
      'typescript': 'blue',
      'go': 'green',
      'rust': 'red'
    };
    return colors[lowerLanguage] || 'default';
  };

  const getLeetCodeUrl = (record) => {
    if (!record) return '#';
    // Use submission_url if available
    if (record.submission_url) {
      return record.submission_url;
    }
    // Fallback to problem title slug if available
    if (record.title_slug) {
      return `https://leetcode.com/problems/${record.title_slug}/`;
    }
    // If no direct link available, use problem title for search
    const problemTitle = record.problem_title || '';
    return `https://leetcode.com/problemset/all/?search=${encodeURIComponent(problemTitle)}`;
  };

  const getProblemDisplay = (record) => {
    if (!record) return 'Unknown Problem';
    // Use question_id if available
    if (record.question_id) {
      const problemTitle = record.problem_title || 'Unknown';
      return `${record.question_id}. ${problemTitle}`;
    }
    // Fallback to just problem title
    return record.problem_title || 'Unknown Problem';
  };

  const getLanguageForHighlight = (language) => {
    if (!language || typeof language !== 'string') return 'plaintext';
    const lowerLanguage = language.toLowerCase();
    if (lowerLanguage.includes('python')) return 'python';
    if (lowerLanguage.includes('java')) return 'java';
    if (lowerLanguage.includes('cpp')) return 'cpp';
    if (lowerLanguage.includes('c')) return 'c';
    if (lowerLanguage.includes('javascript')) return 'javascript';
    if (lowerLanguage.includes('typescript')) return 'typescript';
    if (lowerLanguage.includes('go')) return 'go';
    if (lowerLanguage.includes('rust')) return 'rust';
    return 'plaintext';
  };

  const columns = [
    {
      title: t('records.problem'),
      key: 'problem',
      width: 300,
      render: (_, record) => (
        <Tooltip title={t('records.openInLeetCode')}>
          <Link
            href={getLeetCodeUrl(record)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1890ff' }}
          >
            <Text strong style={{ fontSize: '14px' }}>
              {getProblemDisplay(record)}
            </Text>
          </Link>
        </Tooltip>
      )
    },
    {
      title: t('records.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const safeStatus = status && typeof status === 'string' ? status : '';
        const lowerStatus = safeStatus.toLowerCase();
        return (
          <Tag 
            color={getStatusColor(safeStatus)}
            icon={lowerStatus === 'accepted' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          >
            {safeStatus || 'Unknown'}
          </Tag>
        );
      }
    },
    {
      title: t('records.language'),
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: (language) => {
        const safeLanguage = language && typeof language === 'string' ? language : '';
        return (
          <Tag color={getLanguageColor(safeLanguage)}>
            {safeLanguage || 'Unknown'}
          </Tag>
        );
      }
    },
    {
      title: t('records.runtime'),
      dataIndex: 'runtime',
      key: 'runtime',
      width: 120,
      render: (runtime) => (
        <Text type="secondary">
          {runtime || '-'}
        </Text>
      )
    },
    {
      title: t('records.memory'),
      dataIndex: 'memory',
      key: 'memory',
      width: 120,
      render: (memory) => (
        <Text type="secondary">
          {memory || '-'}
        </Text>
      )
    },
    {
      title: t('records.runtimePercentile'),
      dataIndex: 'runtime_percentile',
      key: 'runtime_percentile',
      width: 100,
      render: (percentile) => {
        if (percentile !== null && percentile !== undefined) {
          const value = typeof percentile === 'number' ? percentile.toFixed(1) : percentile;
          const color = percentile <= 25 ? 'green' : percentile <= 50 ? 'orange' : 'red';
          return (
            <Tag color={color}>
              {value}%
            </Tag>
          );
        }
        return <Text type="secondary">-</Text>;
      }
    },
    {
      title: t('records.memoryPercentile'),
      dataIndex: 'memory_percentile',
      key: 'memory_percentile',
      width: 100,
      render: (percentile) => {
        if (percentile !== null && percentile !== undefined) {
          const value = typeof percentile === 'number' ? percentile.toFixed(1) : percentile;
          const color = percentile <= 25 ? 'green' : percentile <= 50 ? 'orange' : 'red';
          return (
            <Tag color={color}>
              {value}%
            </Tag>
          );
        }
        return <Text type="secondary">-</Text>;
      }
    },
    {
      title: t('records.ojType'),
      dataIndex: 'oj_type',
      key: 'oj_type',
      width: 80,
      render: (ojType) => {
        const safeOjType = ojType && typeof ojType === 'string' ? ojType : 'leetcode';
        return (
          <Tag color="blue">
            {safeOjType}
          </Tag>
        );
      }
    },
    {
      title: t('records.syncStatus'),
      dataIndex: 'sync_status',
      key: 'sync_status',
      width: 100,
      render: (syncStatus) => {
        const safeSyncStatus = syncStatus && typeof syncStatus === 'string' ? syncStatus : 'pending';
        const colorMap = {
          'synced': 'success',
          'syncing': 'processing',
          'failed': 'error',
          'pending': 'default'
        };
        return (
          <Tag color={colorMap[safeSyncStatus] || 'default'}>
            {safeSyncStatus}
          </Tag>
        );
      }
    },
    {
      title: t('records.aiAnalysis'),
      dataIndex: 'ai_analysis',
      key: 'ai_analysis',
      width: 80,
      render: (aiAnalysis) => {
        if (aiAnalysis && typeof aiAnalysis === 'object') {
          return (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              {t('records.analyzed')}
            </Tag>
          );
        }
        return (
          <Tag color="default">
            {t('records.notAnalyzed')}
          </Tag>
        );
      }
    },
    {
      title: t('records.topicTags'),
      dataIndex: 'topic_tags',
      key: 'topic_tags',
      width: 150,
      render: (topicTags) => {
        if (topicTags && Array.isArray(topicTags) && topicTags.length > 0) {
          return (
            <div>
              {topicTags.slice(0, 2).map((tag, index) => (
                <Tag key={index} color="blue" style={{ marginBottom: 2, fontSize: '10px' }}>
                  {tag}
                </Tag>
              ))}
              {topicTags.length > 2 && (
                <Tag color="default" style={{ fontSize: '10px' }}>
                  +{topicTags.length - 2}
                </Tag>
              )}
            </div>
          );
        }
        return <Text type="secondary">-</Text>;
      }
    },
    {
      title: t('records.externalServices'),
      key: 'external_services',
      width: 120,
      render: (_, record) => {
        const services = [];
        if (record.notion_url) {
          services.push(
            <Tag key="notion" color="green" style={{ fontSize: '10px', marginBottom: 2 }}>
              Notion
            </Tag>
          );
        }
        if (record.github_pushed) {
          services.push(
            <Tag key="github" color="purple" style={{ fontSize: '10px', marginBottom: 2 }}>
              GitHub
            </Tag>
          );
        }
        if (services.length > 0) {
          return <div>{services}</div>;
        }
        return <Text type="secondary">-</Text>;
      }
    },
    {
      title: t('records.testCases'),
      key: 'testcases',
      width: 140,
      render: (_, record) => {
        if (record.total_testcases !== null && record.total_testcases !== undefined && 
            record.total_correct !== null && record.total_correct !== undefined) {
          return (
            <div>
              <Text type="secondary">
                {record.total_correct}/{record.total_testcases}
              </Text>
              {record.success_rate !== null && record.success_rate !== undefined && (
                <div style={{ fontSize: '11px', color: '#999' }}>
                  {typeof record.success_rate === 'number' ? record.success_rate.toFixed(1) : record.success_rate}%
                </div>
              )}
            </div>
          );
        }
        return <Text type="secondary">-</Text>;
      }
    },
    {
      title: t('records.submitTime'),
      dataIndex: 'submit_time',
      key: 'submit_time',
      width: 150,
      render: (time) => {
        try {
          if (!time) return <Text type="secondary">-</Text>;
          const dayjsTime = dayjs(time);
          if (!dayjsTime.isValid()) return <Text type="secondary">-</Text>;
          return <Text type="secondary">{dayjsTime.format('YYYY-MM-DD HH:mm')}</Text>;
        } catch (error) {
          console.error('Error rendering submit_time:', error, time);
          return <Text type="secondary">-</Text>;
        }
      },
      sorter: (a, b) => {
        const timeA = a.submit_time ? new Date(a.submit_time) : new Date(0);
        const timeB = b.submit_time ? new Date(b.submit_time) : new Date(0);
        return timeA - timeB;
      },
      defaultSortOrder: 'descend'
    },
    {
      title: t('records.actions'),
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title={t('records.view')}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewRecord(record)}
          />
        </Tooltip>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>
        <BookOutlined /> {t('records.title')}
      </Title>

      {/* Statistics */}
      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title={t('records.totalSubmissions')} value={stats.total || 0} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title={t('records.uniqueProblems')} value={stats.unique_problems || 0} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title={t('records.solvedProblems')} value={stats.solved || 0} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title={t('records.successRate')} value={stats.successRate || 0} suffix="%" precision={1} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title={t('records.languages')} value={stats.languages || 0} />
          </Col>
        </Row>
      </Spin>

      {/* Record List */}
      <Card
        title={t('records.recordList')}
        extra={
          <Space>
            <Button onClick={loadRecords} loading={loading}>
              {t('common.refresh')}
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={records}
            rowKey={(record) => record?.submission_id || Math.random().toString()}
            scroll={{ x: 2100 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} ${t('common.items')}`
            }}
            locale={{
              emptyText: t('records.noRecords')
            }}
          />
        </Spin>
      </Card>

      {/* View Record Modal */}
      <Modal
        title={t('records.viewRecord')}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            {t('common.close')}
          </Button>
        ]}
        width={800}
      >
        {currentRecord && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Text strong>{t('records.language')}:</Text>
                <Tag color={getLanguageColor(currentRecord.language && typeof currentRecord.language === 'string' ? currentRecord.language : '')} style={{ marginLeft: 8 }}>
                  {currentRecord.language || 'Unknown'}
                </Tag>
              </Col>
              <Col span={8}>
                <Text strong>{t('records.status')}:</Text>
                <Tag 
                  color={getStatusColor(currentRecord.status && typeof currentRecord.status === 'string' ? currentRecord.status : '')}
                  style={{ marginLeft: 8 }}
                >
                  {currentRecord.status || 'Unknown'}
                </Tag>
              </Col>
              <Col span={8}>
                <Text strong>{t('records.runtime')}:</Text>
                <Text style={{ marginLeft: 8 }}>
                  {currentRecord.runtime || '-'}
                </Text>
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Text strong>{t('records.memory')}:</Text>
                <Text style={{ marginLeft: 8 }}>
                  {currentRecord.memory || '-'}
                </Text>
              </Col>
              <Col span={8}>
                <Text strong>{t('records.runtimePercentile')}:</Text>
                <Text style={{ marginLeft: 8 }}>
                  {currentRecord.runtime_percentile !== null && currentRecord.runtime_percentile !== undefined 
                    ? `${typeof currentRecord.runtime_percentile === 'number' ? currentRecord.runtime_percentile.toFixed(1) : currentRecord.runtime_percentile}%`
                    : '-'
                  }
                </Text>
              </Col>
              <Col span={8}>
                <Text strong>{t('records.memoryPercentile')}:</Text>
                <Text style={{ marginLeft: 8 }}>
                  {currentRecord.memory_percentile !== null && currentRecord.memory_percentile !== undefined 
                    ? `${typeof currentRecord.memory_percentile === 'number' ? currentRecord.memory_percentile.toFixed(1) : currentRecord.memory_percentile}%`
                    : '-'
                  }
                </Text>
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Text strong>{t('records.ojType')}:</Text>
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {currentRecord.oj_type || 'leetcode'}
                </Tag>
              </Col>
              <Col span={8}>
                <Text strong>{t('records.syncStatus')}:</Text>
                <Tag 
                  color={currentRecord.sync_status === 'synced' ? 'success' : 
                         currentRecord.sync_status === 'failed' ? 'error' : 
                         currentRecord.sync_status === 'syncing' ? 'processing' : 'default'} 
                  style={{ marginLeft: 8 }}
                >
                  {currentRecord.sync_status || 'pending'}
                </Tag>
              </Col>
              <Col span={8}>
                <Text strong>{t('records.submitTime')}:</Text>
                <Text style={{ marginLeft: 8, fontSize: '12px' }}>
                  {(() => {
                    try {
                      if (!currentRecord.submit_time) return '-';
                      const dayjsTime = dayjs(currentRecord.submit_time);
                      if (!dayjsTime.isValid()) return '-';
                      return dayjsTime.format('MM-DD HH:mm');
                    } catch (error) {
                      console.error('Error formatting submit_time in modal:', error, currentRecord.submit_time);
                      return '-';
                    }
                  })()}
                </Text>
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>{t('records.createdAt')}:</Text>
                <Text style={{ marginLeft: 8, fontSize: '12px' }}>
                  {(() => {
                    try {
                      if (!currentRecord.created_at) return '-';
                      const dayjsTime = dayjs(currentRecord.created_at);
                      if (!dayjsTime.isValid()) return '-';
                      return dayjsTime.format('YYYY-MM-DD HH:mm');
                    } catch (error) {
                      console.error('Error formatting created_at in modal:', error, currentRecord.created_at);
                      return '-';
                    }
                  })()}
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>{t('records.updatedAt')}:</Text>
                <Text style={{ marginLeft: 8, fontSize: '12px' }}>
                  {(() => {
                    try {
                      if (!currentRecord.updated_at) return '-';
                      const dayjsTime = dayjs(currentRecord.updated_at);
                      if (!dayjsTime.isValid()) return '-';
                      return dayjsTime.format('YYYY-MM-DD HH:mm');
                    } catch (error) {
                      console.error('Error formatting updated_at in modal:', error, currentRecord.updated_at);
                      return '-';
                    }
                  })()}
                </Text>
              </Col>
            </Row>
            
            {/* Test Case Information */}
            {(currentRecord.total_testcases !== null && currentRecord.total_testcases !== undefined) && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Text strong>{t('records.totalTestcases')}:</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {currentRecord.total_testcases}
                  </Text>
                </Col>
                <Col span={8}>
                  <Text strong>{t('records.correctTestcases')}:</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {currentRecord.total_correct || 0}
                  </Text>
                </Col>
                <Col span={8}>
                  <Text strong>{t('records.successRate')}:</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {currentRecord.success_rate ? `${currentRecord.success_rate}%` : '-'}
                  </Text>
                </Col>
              </Row>
            )}
            
            {/* Error Information */}
            {(currentRecord.runtime_error || currentRecord.compile_error) && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.errorInformation')}:</Text>
                <div style={{ marginTop: 8 }}>
                  {currentRecord.runtime_error && (
                    <div style={{ marginBottom: 8 }}>
                      <Text type="danger" strong>{t('records.runtimeError')}:</Text>
                      <div style={{ 
                        marginTop: 4, 
                        padding: 8, 
                        backgroundColor: '#fff2f0', 
                        border: '1px solid #ffccc7',
                        borderRadius: 4,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {currentRecord.runtime_error}
                      </div>
                    </div>
                  )}
                  {currentRecord.compile_error && (
                    <div style={{ marginBottom: 8 }}>
                      <Text type="danger" strong>{t('records.compileError')}:</Text>
                      <div style={{ 
                        marginTop: 4, 
                        padding: 8, 
                        backgroundColor: '#fff2f0', 
                        border: '1px solid #ffccc7',
                        borderRadius: 4,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {currentRecord.compile_error}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Test Case Details */}
            {currentRecord.test_descriptions && Array.isArray(currentRecord.test_descriptions) && currentRecord.test_descriptions.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.testCases')}:</Text>
                <div style={{ marginTop: 8 }}>
                  {currentRecord.test_descriptions.map((description, index) => (
                    <div key={index} style={{ 
                      marginBottom: 8, 
                      padding: 8, 
                      backgroundColor: '#f6ffed', 
                      border: '1px solid #b7eb8f',
                      borderRadius: 4
                    }}>
                      <Text strong>Test {index + 1}:</Text>
                      <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: '12px' }}>
                        {description || 'No description available'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Code Output vs Expected Output */}
            {(currentRecord.code_output || currentRecord.expected_output) && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.outputComparison')}:</Text>
                <Row gutter={16} style={{ marginTop: 8 }}>
                  {currentRecord.code_output && (
                    <Col span={12}>
                      <Text type="secondary">{t('records.codeOutput')}:</Text>
                      <div style={{ 
                        marginTop: 4, 
                        padding: 8, 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: 4,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap',
                        maxHeight: 200,
                        overflow: 'auto'
                      }}>
                        {currentRecord.code_output}
                      </div>
                    </Col>
                  )}
                  {currentRecord.expected_output && (
                    <Col span={12}>
                      <Text type="secondary">{t('records.expectedOutput')}:</Text>
                      <div style={{ 
                        marginTop: 4, 
                        padding: 8, 
                        backgroundColor: '#f6ffed', 
                        borderRadius: 4,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap',
                        maxHeight: 200,
                        overflow: 'auto'
                      }}>
                        {currentRecord.expected_output}
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            )}
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>{t('records.problemTitle')}:</Text>
              <Link
                href={getLeetCodeUrl(currentRecord)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: 8, color: '#1890ff' }}
              >
                {currentRecord.problem_title}
              </Link>
            </div>
            
            {currentRecord.topic_tags && Array.isArray(currentRecord.topic_tags) && currentRecord.topic_tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.topicTags')}:</Text>
                <div style={{ marginTop: 8 }}>
                  {currentRecord.topic_tags.map((tag, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                      {tag || 'Unknown Tag'}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            
            {currentRecord.submission_url && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.submissionUrl')}:</Text>
                <Link
                  href={currentRecord.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginLeft: 8, color: '#1890ff' }}
                >
                  {t('records.viewSubmission')}
                </Link>
              </div>
            )}
            
            {/* AI Analysis Information */}
            {currentRecord.ai_analysis && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.aiAnalysis')}:</Text>
                <Tag color="green" style={{ marginLeft: 8 }}>
                  {t('records.analyzed')}
                </Tag>
                <div style={{ 
                  marginTop: 8, 
                  padding: 8, 
                  backgroundColor: '#f0f9ff', 
                  border: '1px solid #91d5ff',
                  borderRadius: 4,
                  fontSize: '12px'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(currentRecord.ai_analysis, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {/* External Service Information */}
            {(currentRecord.notion_url || currentRecord.github_pushed) && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('records.externalServices')}:</Text>
                <div style={{ marginTop: 8 }}>
                  {currentRecord.notion_url && (
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary">{t('records.notionUrl')}:</Text>
                      <Link
                        href={currentRecord.notion_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: 8, color: '#1890ff' }}
                      >
                        {t('records.viewInNotion')}
                      </Link>
                    </div>
                  )}
                  {currentRecord.github_pushed && (
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary">{t('records.githubPushed')}:</Text>
                      <Text style={{ marginLeft: 8 }}>
                        {(() => {
                          try {
                            const dayjsTime = dayjs(currentRecord.github_pushed);
                            if (!dayjsTime.isValid()) return '-';
                            return dayjsTime.format('YYYY-MM-DD HH:mm:ss');
                          } catch (error) {
                            console.error('Error formatting github_pushed:', error, currentRecord.github_pushed);
                            return '-';
                          }
                        })()}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <Text strong>{t('records.code')}:</Text>
              <div style={{ 
                marginTop: 8, 
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 400
              }}>
                <SyntaxHighlighter
                  language={getLanguageForHighlight(currentRecord.language)}
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    borderRadius: 4,
                    fontSize: '12px',
                    lineHeight: '1.4'
                  }}
                >
                  {currentRecord.code || ''}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Records; 