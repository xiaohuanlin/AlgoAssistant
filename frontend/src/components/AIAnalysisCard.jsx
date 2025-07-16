import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Space,
  Tooltip,
  Collapse,
  Progress,
  Divider,
  Badge
} from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  RobotOutlined,
  BulbOutlined,
  SafetyOutlined,
  BookOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CodeOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './AIAnalysisCard.css';

const { Text, Link } = Typography;
const { Panel } = Collapse;

const AIAnalysisCard = ({ aiAnalysis }) => {
  const { t } = useTranslation();
  const [activeKeys, setActiveKeys] = useState(['summary', 'complexity', 'scores']);

  if (!aiAnalysis) {
    return null;
  }

  const handlePanelChange = (keys) => {
    setActiveKeys(keys);
  };

  const renderScoreTag = (score, color = 'green') => {
    const percentage = Math.round(score * 10);
    return (
      <Tag color={color} className="score-tag">
        {percentage}/10
      </Tag>
    );
  };

  const renderConfidenceTag = (confidence) => {
    const percentage = Math.round(confidence * 100);
    let color = 'green';
    if (percentage < 60) color = 'red';
    else if (percentage < 80) color = 'orange';

    return (
      <Tag color={color} className="score-tag">
        {percentage}%
      </Tag>
    );
  };

  return (
    <Card
      className="ai-analysis-card"
      title={
        <Space>
          <RobotOutlined style={{ color: 'white' }} />
          <span style={{ color: 'white' }}>{t('records.aiAnalysis')}</span>
          <Badge
            status="processing"
            text={t('aiAnalysis.analysisComplete')}
            style={{ fontSize: '12px', color: 'white' }}
          />
        </Space>
      }
      style={{ marginBottom: 24 }}
      size="small"
      extra={
        <Text style={{ fontSize: '12px', color: 'white' }}>
          {t('aiAnalysis.modelVersion')}: {aiAnalysis.model_version}
        </Text>
      }
    >
      <Collapse
        activeKey={activeKeys}
        onChange={handlePanelChange}
        ghost
        size="small"
      >
        {/* Summary and Algorithm Types */}
        <Panel
          header={
            <Space>
              <BulbOutlined style={{ color: '#1890ff' }} />
              <Text strong>{t('aiAnalysis.summary')}</Text>
            </Space>
          }
          key="summary"
        >
          <div style={{ padding: '8px 0' }}>
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiAnalysis.summary}
              </ReactMarkdown>
            </div>

            <Divider style={{ margin: '16px 0 12px 0' }} />

            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <div style={{ width: '100%' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: '13px' }}>
                      {t('aiAnalysis.algorithmType')}
                      <Tooltip title={t('aiAnalysis.algorithmTypeDesc')}>
                        <span style={{ color: '#aaa', marginLeft: 4 }}>?</span>
                      </Tooltip>
                    </Text>
                  </div>
                  <Tag color="purple" icon={<CodeOutlined />}>
                    {aiAnalysis.algorithm_type}
                  </Tag>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ width: '100%' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: '13px' }}>
                      {t('aiAnalysis.solutionTypes')}
                      <Tooltip title={t('aiAnalysis.solutionTypesDesc')}>
                        <span style={{ color: '#aaa', marginLeft: 4 }}>?</span>
                      </Tooltip>
                    </Text>
                  </div>
                  <div className="tag-container">
                    {aiAnalysis.solution_types?.map((type, idx) => (
                      <Tag key={idx} color="blue">
                        {type}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Panel>

        {/* Complexity Analysis */}
        <Panel
          header={
            <Space>
              <ExperimentOutlined style={{ color: '#722ed1' }} />
              <Text strong>{t('aiAnalysis.complexityAnalysis')}</Text>
            </Space>
          }
          key="complexity"
        >
          <div style={{ padding: '8px 0' }}>
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <div style={{ width: '100%' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: '13px' }}>
                      {t('aiAnalysis.timeComplexity')}
                      <Tooltip title={t('aiAnalysis.timeComplexityDesc')}>
                        <span style={{ color: '#aaa', marginLeft: 4 }}>?</span>
                      </Tooltip>
                    </Text>
                  </div>
                  <Text code className="complexity-tag" style={{ color: '#1890ff' }}>
                    {aiAnalysis.time_complexity}
                  </Text>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ width: '100%' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: '13px' }}>
                      {t('aiAnalysis.spaceComplexity')}
                      <Tooltip title={t('aiAnalysis.spaceComplexityDesc')}>
                        <span style={{ color: '#aaa', marginLeft: 4 }}>?</span>
                      </Tooltip>
                    </Text>
                  </div>
                  <Text code className="complexity-tag" style={{ color: '#52c41a' }}>
                    {aiAnalysis.space_complexity}
                  </Text>
                </div>
              </Col>
            </Row>
          </div>
        </Panel>

        {/* Scores and Confidence */}
        <Panel
          header={
            <Space>
              <TrophyOutlined style={{ color: '#faad14' }} />
              <Text strong>{t('aiAnalysis.scoresAndConfidence')}</Text>
            </Space>
          }
          key="scores"
        >
          <div style={{ padding: '8px 0' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div style={{ width: '100%' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: '13px' }}>
                      {t('aiAnalysis.codeQualityScore')}
                      <Tooltip title={t('aiAnalysis.codeQualityScoreDesc')}>
                        <span style={{ color: '#aaa', marginLeft: 4 }}>?</span>
                      </Tooltip>
                    </Text>
                  </div>
                  <div>
                    {renderScoreTag(aiAnalysis.code_quality_score, 'green')}
                    <Progress
                      percent={aiAnalysis.code_quality_score * 10}
                      size="small"
                      showInfo={false}
                      strokeColor="#52c41a"
                      className="score-progress"
                    />
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div style={{ width: '100%' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: '13px' }}>
                      {t('aiAnalysis.styleScore')}
                      <Tooltip title={t('aiAnalysis.styleScoreDesc')}>
                        <span style={{ color: '#aaa', marginLeft: 4 }}>?</span>
                      </Tooltip>
                    </Text>
                  </div>
                  <div>
                    {renderScoreTag(aiAnalysis.style_score, 'cyan')}
                    <Progress
                      percent={aiAnalysis.style_score * 10}
                      size="small"
                      showInfo={false}
                      strokeColor="#13c2c2"
                      className="score-progress"
                    />
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div style={{ width: '100%' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: '13px' }}>
                      {t('aiAnalysis.correctnessConfidence')}
                      <Tooltip title={t('aiAnalysis.correctnessConfidenceDesc')}>
                        <span style={{ color: '#aaa', marginLeft: 4 }}>?</span>
                      </Tooltip>
                    </Text>
                  </div>
                  <div>
                    {renderConfidenceTag(aiAnalysis.correctness_confidence)}
                    <Progress
                      percent={aiAnalysis.correctness_confidence * 100}
                      size="small"
                      showInfo={false}
                      strokeColor="#faad14"
                      className="score-progress"
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Panel>

        {/* Step Analysis */}
        <Panel
          header={
            <Space>
              <ClockCircleOutlined style={{ color: '#1890ff' }} />
              <Text strong>{t('aiAnalysis.stepAnalysis')}</Text>
            </Space>
          }
          key="steps"
        >
          <div style={{ padding: '8px 0' }}>
            <Tooltip title={t('aiAnalysis.stepAnalysisDesc')}>
              <Text type="secondary" style={{ fontSize: '12px', marginBottom: 8, display: 'block' }}>
                {t('aiAnalysis.stepAnalysisDesc')}
              </Text>
            </Tooltip>
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiAnalysis.step_analysis?.map((step, idx) => `${idx + 1}. ${step}`).join('\n\n')}
              </ReactMarkdown>
            </div>
          </div>
        </Panel>

        {/* Improvement Suggestions */}
        <Panel
          header={
            <Space>
              <BulbOutlined style={{ color: '#52c41a' }} />
              <Text strong>{t('aiAnalysis.improvementSuggestions')}</Text>
            </Space>
          }
          key="improvements"
        >
          <div style={{ padding: '8px 0' }}>
            <Tooltip title={t('aiAnalysis.improvementSuggestionsDesc')}>
              <Text type="secondary" style={{ fontSize: '12px', marginBottom: 8, display: 'block' }}>
                {t('aiAnalysis.improvementSuggestionsDesc')}
              </Text>
            </Tooltip>
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiAnalysis.improvement_suggestions}
              </ReactMarkdown>
            </div>
          </div>
        </Panel>

        {/* Edge Cases and Risk Areas */}
        <Panel
          header={
            <Space>
              <SafetyOutlined style={{ color: '#fa8c16' }} />
              <Text strong>{t('aiAnalysis.edgeCasesAndRisks')}</Text>
            </Space>
          }
          key="edgeCases"
        >
          <div style={{ padding: '8px 0' }}>
            {/* Covered Edge Cases */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ fontSize: '13px' }}>
                  {t('aiAnalysis.edgeCasesCovered')}
                  <Tooltip title={t('aiAnalysis.edgeCasesCoveredDesc')}>
                    <span style={{ color: '#aaa', marginLeft: 4 }}>?</span>
                  </Tooltip>
                </Text>
              </div>
              {aiAnalysis.edge_cases_covered?.length > 0 ? (
                <div className="markdown-content edge-cases-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {aiAnalysis.edge_cases_covered.map((ec, idx) => `- ${ec}`).join('\n')}
                  </ReactMarkdown>
                </div>
              ) : (
                <Text type="secondary">{t('common.none')}</Text>
              )}
            </div>

            {/* High Risk Areas */}
            <div>
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ fontSize: '13px' }}>
                  {t('aiAnalysis.riskAreas')}
                  <Tooltip title={t('aiAnalysis.riskAreasDesc')}>
                    <span style={{ color: '#aaa', marginLeft: 4 }}>?</span>
                  </Tooltip>
                </Text>
              </div>
              {aiAnalysis.risk_areas?.length > 0 ? (
                <div className="markdown-content risk-areas-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {aiAnalysis.risk_areas.map((risk, idx) => `- ⚠️ ${risk}`).join('\n')}
                  </ReactMarkdown>
                </div>
              ) : (
                <Text type="secondary">{t('common.none')}</Text>
              )}
            </div>
          </div>
        </Panel>

        {/* Learning Points */}
        <Panel
          header={
            <Space>
              <BookOutlined style={{ color: '#722ed1' }} />
              <Text strong>{t('aiAnalysis.learningPoints')}</Text>
            </Space>
          }
          key="learning"
        >
          <div style={{ padding: '8px 0' }}>
            <Tooltip title={t('aiAnalysis.learningPointsDesc')}>
              <Text type="secondary" style={{ fontSize: '12px', marginBottom: 8, display: 'block' }}>
                {t('aiAnalysis.learningPointsDesc')}
              </Text>
            </Tooltip>
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiAnalysis.learning_points?.map((lp, idx) => `${idx + 1}. ${lp}`).join('\n\n')}
              </ReactMarkdown>
            </div>
          </div>
        </Panel>

        {/* Related Problems */}
        <Panel
          header={
            <Space>
              <LinkOutlined style={{ color: '#1890ff' }} />
              <Text strong>{t('aiAnalysis.relatedProblems')}</Text>
            </Space>
          }
          key="related"
        >
          <div style={{ padding: '8px 0' }}>
            <Tooltip title={t('aiAnalysis.relatedProblemsDesc')}>
              <Text type="secondary" style={{ fontSize: '12px', marginBottom: 8, display: 'block' }}>
                {t('aiAnalysis.relatedProblemsDesc')}
              </Text>
            </Tooltip>
            <div className="related-links">
              {aiAnalysis.related_problems?.length > 0 ? (
                aiAnalysis.related_problems.map((url, idx) => (
                  <Link
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {url}
                  </Link>
                ))
              ) : (
                <Text type="secondary">{t('common.none')}</Text>
              )}
            </div>
          </div>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default AIAnalysisCard;
