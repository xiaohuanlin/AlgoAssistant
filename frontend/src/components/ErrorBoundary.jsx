import React, { Component } from 'react';
import { Result, Button, Typography } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

// Create a wrapper component to handle hooks
const ErrorBoundaryWrapper = (props) => {
  const { t } = useTranslation();
  return <ErrorBoundary t={t} {...props} />;
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 静默处理错误边界捕获的错误
    this.setState({ errorInfo });

    // Error reporting logic can be added here
    // errorReportingService.reportError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title={t('common.error')}
          subTitle={
            <div>
              <Text type="secondary">
                {this.state.error?.message || t('common.unknownError')}
              </Text>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details style={{ marginTop: 16, textAlign: 'left' }}>
                  <summary>{t('common.errorDetails')}</summary>
                  <pre style={{
                    background: '#f5f5f5',
                    padding: 16,
                    borderRadius: 4,
                    overflow: 'auto',
                    fontSize: 12
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          }
          extra={[
            <Button
              type="primary"
              key="retry"
              icon={<ReloadOutlined />}
              onClick={this.handleRetry}
            >
              {t('common.retry')}
            </Button>,
            <Button
              key="home"
              icon={<HomeOutlined />}
              onClick={this.handleGoHome}
            >
              {t('common.goHome')}
            </Button>
          ]}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWrapper;
