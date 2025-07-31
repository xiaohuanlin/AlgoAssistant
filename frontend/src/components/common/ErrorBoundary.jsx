import React, { Component } from 'react';
import { Result, Button, Typography, Space } from 'antd';
import { ReloadOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

/**
 * Enhanced Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);

    // Optional: Report to error monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // In production, you might want to send errors to services like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // TODO: Send to error monitoring service
    // For development, log the error report
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error Report:', errorReport);
    }
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, showDetails = process.env.NODE_ENV === 'development' } =
      this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(error, errorInfo, this.handleReset)
          : fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
            padding: '20px',
          }}
        >
          <Result
            status="error"
            icon={<BugOutlined />}
            title="Something went wrong"
            subTitle="Sorry, an unexpected error occurred. Please try refreshing the page or go back to home."
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                <Button icon={<HomeOutlined />} onClick={this.handleGoHome}>
                  Go Home
                </Button>
              </Space>
            }
          >
            {showDetails && error && (
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: '#fafafa',
                  borderRadius: '8px',
                  maxWidth: '600px',
                  textAlign: 'left',
                }}
              >
                <Paragraph>
                  <Text strong>Error Details (Development Only):</Text>
                </Paragraph>
                <div
                  style={{
                    maxHeight: '200px',
                    overflow: 'auto',
                    padding: '8px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ color: '#cf1322', marginBottom: '8px' }}>
                    <strong>Error:</strong> {error.toString()}
                  </div>
                  {errorInfo?.componentStack && (
                    <div style={{ color: '#666' }}>
                      <strong>Component Stack:</strong>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: '4px 0' }}>
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
