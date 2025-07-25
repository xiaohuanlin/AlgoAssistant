import React from 'react';
import { List, Avatar, Tag, Empty, Spin, Typography, Space } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ActionButton from '../common/ActionButton';

const { Text, Paragraph } = Typography;

const RecentActivityList = ({ data = [], loading = false, mobile = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'success';
      case 'wrong answer':
        return 'error';
      case 'time limit exceeded':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getLanguageColor = (language) => {
    const colors = {
      'python': 'blue',
      'java': 'orange',
      'cpp': 'purple',
      'javascript': 'gold',
      'typescript': 'cyan'
    };
    return colors[language?.toLowerCase()] || 'default';
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleDateString();
  };

  const handleViewRecord = (recordId) => {
    if (recordId) {
      navigate(`/records/${recordId}`);
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return <Spin />;
  }

  if (!data || data.length === 0) {
    return (
      <Empty
        description={t('dashboard.noRecentActivity')}
        style={{ padding: mobile ? '20px 0' : '40px 0' }}
      />
    );
  }

  return (
    <List
      itemLayout="horizontal"
      dataSource={data}
      size="small"
      renderItem={(item) => (
        <List.Item
          style={{
            border: '1px solid #f0f0f0',
            borderRadius: '6px',
            marginBottom: '8px',
            padding: mobile ? '8px 12px' : '10px 14px',
            backgroundColor: '#fafafa'
          }}
          extra={
            <ActionButton
              type="view"
              size={mobile ? 'small' : 'default'}
              onClick={() => handleViewRecord(item.id)}
            />
          }
        >
          <List.Item.Meta
            avatar={
              <Avatar
                icon={<CodeOutlined />}
                size={mobile ? 28 : 32}
                style={{ backgroundColor: '#1890ff' }}
              />
            }
            title={
              <Text strong style={{
                fontSize: mobile ? '13px' : '14px',
                lineHeight: 1.2
              }}>
                {item.problemTitle || t('records.unknownProblem')}
              </Text>
            }
            description={
              <div style={{ lineHeight: 1.3 }}>
                {/* Submit Time */}
                <div style={{ marginBottom: '4px' }}>
                  <Text type="secondary" style={{
                    fontSize: mobile ? '11px' : '12px',
                    color: '#999'
                  }}>
                    {t('records.submitTime')}: {formatTime(item.submissionTime || item.submitTime)}
                  </Text>
                </div>

                {/* Problem Source and Description in one compact line */}
                <div style={{ marginBottom: '6px' }}>
                  {item.problemSource && (
                    <span style={{ marginRight: '8px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {t('records.problemSource')}:
                      </Text>
                      <Tag size="small" color="blue" style={{ marginLeft: '2px' }}>
                        {item.problemSource}
                      </Tag>
                    </span>
                  )}

                  {item.problemDescription && (
                    <Text
                      type="secondary"
                      style={{
                        fontSize: mobile ? '11px' : '12px',
                        color: '#666'
                      }}
                      ellipsis={{ tooltip: item.problemDescription }}
                    >
                      {truncateText(item.problemDescription, mobile ? 50 : 80)}
                    </Text>
                  )}
                </div>

                {/* Status and Tags in compact layout */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  <Tag
                    color={getStatusColor(item.status || item.executionResult)}
                    size="small"
                    style={{ margin: 0 }}
                  >
                    {item.status || item.executionResult || t('records.unknown')}
                  </Tag>

                  {item.language && (
                    <Tag
                      color={getLanguageColor(item.language)}
                      size="small"
                      style={{ margin: 0 }}
                    >
                      {item.language}
                    </Tag>
                  )}

                  {item.category && (
                    <Tag size="small" style={{ margin: 0 }}>
                      {item.category}
                    </Tag>
                  )}

                  {item.runtime && (
                    <Text type="secondary" style={{
                      fontSize: '11px',
                      marginLeft: '6px'
                    }}>
                      {t('records.runtime')}: {item.runtime}
                    </Text>
                  )}
                </div>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );
};

export default RecentActivityList;
