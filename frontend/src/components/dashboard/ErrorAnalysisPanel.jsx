import React, { useState } from 'react';
import { List, Tag, Empty, Spin, Button, Modal, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatLocalTime } from '../../utils';
import { useNavigate } from 'react-router-dom';
import ActionButton from '../common/ActionButton';

const ErrorAnalysisPanel = ({ data, loading = false, mobile = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAllModal, setShowAllModal] = useState(false);

  const formatDate = (dateString) => {
    return formatLocalTime(dateString);
  };

  const getErrorTypeColor = (errorType) => {
    switch (errorType?.toLowerCase()) {
      case 'wrong answer':
        return 'error';
      case 'time limit exceeded':
        return 'warning';
      case 'runtime error':
        return 'error';
      case 'memory limit exceeded':
        return 'orange';
      default:
        return 'default';
    }
  };

  const handleViewProblem = (problemId) => {
    if (problemId) {
      navigate(`/records?problemId=${problemId}`);
    }
  };

  const handleViewReview = (problemId) => {
    if (problemId) {
      navigate(`/review?problemId=${problemId}`);
    }
  };

  if (loading) {
    return <Spin />;
  }

  if (!data || !data.recentErrors || data.recentErrors.length === 0) {
    return (
      <Empty
        description={t('dashboard.noErrors')}
        style={{ padding: mobile ? '20px 0' : '40px 0' }}
      />
    );
  }

  const { recentErrors, totalErrorCount } = data;
  const displayLimit = mobile ? 3 : 5;

  const renderErrorItem = (item, showActions = true) => (
    <List.Item
      style={{
        padding: mobile ? '8px 0' : '12px 0',
        borderBottom: '1px solid #f0f0f0',
      }}
      actions={
        showActions
          ? [
              <ActionButton
                key="view"
                type="view"
                size="small"
                onClick={() => handleViewProblem(item.problemId)}
              />,
              ...(item.needsReview
                ? [
                    <ActionButton
                      key="review"
                      type="review"
                      size="small"
                      onClick={() => handleViewReview(item.problemId)}
                    />,
                  ]
                : []),
            ]
          : null
      }
    >
      <div style={{ fontSize: mobile ? '13px' : '14px', width: '100%' }}>
        <div
          style={{
            fontWeight: 500,
            marginBottom: '4px',
            color: '#262626',
          }}
        >
          {item.problemTitle}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: mobile ? '4px' : '8px',
            alignItems: 'center',
            marginBottom: '4px',
          }}
        >
          <Tag
            color={getErrorTypeColor(item.errorType)}
            size={mobile ? 'small' : 'default'}
          >
            {item.errorType}
          </Tag>
          {item.reviewCount > 0 && (
            <Tag size={mobile ? 'small' : 'default'}>
              {t('review.reviewCount')}: {item.reviewCount}
            </Tag>
          )}
          {item.needsReview && (
            <Tag color="orange" size={mobile ? 'small' : 'default'}>
              {t('review.dueToday')}
            </Tag>
          )}
        </div>
        <div
          style={{
            color: '#999',
            fontSize: mobile ? '11px' : '12px',
          }}
        >
          {formatDate(item.errorDate)}
        </div>
      </div>
    </List.Item>
  );

  return (
    <div>
      {totalErrorCount > 0 && (
        <div
          style={{
            marginBottom: mobile ? 12 : 16,
            padding: mobile ? '8px 12px' : '12px 16px',
            background: '#fff1f0',
            borderRadius: '6px',
            border: '1px solid #ffccc7',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: mobile ? '13px' : '14px',
            }}
          >
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>
              {t('dashboard.totalErrors')}: <strong>{totalErrorCount}</strong>
            </span>
          </div>
        </div>
      )}

      <List
        itemLayout="vertical"
        size={mobile ? 'small' : 'default'}
        dataSource={recentErrors.slice(0, displayLimit)}
        renderItem={(item) => renderErrorItem(item)}
      />

      {recentErrors.length > displayLimit && (
        <Button
          type="link"
          size="small"
          style={{
            padding: '8px 0',
            fontSize: mobile ? '12px' : '14px',
          }}
          onClick={() => setShowAllModal(true)}
        >
          {t('dashboard.viewAll')} ({recentErrors.length - displayLimit}{' '}
          {t('dashboard.more')})
        </Button>
      )}

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            {t('dashboard.errorAnalysis')} - {t('dashboard.viewAll')}
          </Space>
        }
        open={showAllModal}
        onCancel={() => setShowAllModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowAllModal(false)}>
            {t('common.close')}
          </Button>,
          <Button
            key="view-records"
            type="primary"
            onClick={() => {
              setShowAllModal(false);
              navigate('/records?status=error');
            }}
          >
            {t('records.title')}
          </Button>,
        ]}
        width={mobile ? '90vw' : 800}
        style={{ top: 20 }}
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <div style={{ marginBottom: 16 }}>
            <Tag color="error" style={{ fontSize: '14px', padding: '4px 8px' }}>
              {t('dashboard.totalErrors')}: {totalErrorCount}
            </Tag>
          </div>

          <List
            itemLayout="vertical"
            size="small"
            dataSource={recentErrors}
            renderItem={(item) => renderErrorItem(item, false)}
            pagination={{
              pageSize: 10,
              size: 'small',
              showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ErrorAnalysisPanel;
