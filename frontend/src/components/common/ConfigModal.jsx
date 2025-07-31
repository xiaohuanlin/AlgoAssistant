import React, { useState } from 'react';
import { Modal, Form, Button, Space, Alert, Divider, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const ConfigModal = ({
  visible,
  onCancel,
  title,
  icon,
  description,
  children,
  onSave,
  onTest,
  loading = false,
  testLoading = false,
  testResult = null,
  width = 600,
  okText,
  cancelText,
  form,
  helpSections = [],
  className = '',
}) => {
  const { t } = useTranslation();
  const [testStatus, setTestStatus] = useState(null);

  const handleTest = async () => {
    if (!onTest) return;

    try {
      setTestStatus('testing');
      const result = await onTest();
      setTestStatus(result.success ? 'success' : 'error');
    } catch (error) {
      setTestStatus('error');
    }
  };

  const handleSave = async () => {
    if (!onSave) return;

    try {
      const values = await form.validateFields();
      await onSave(values);
    } catch (error) {
      // Form validation or save errors are handled by the parent component
    }
  };

  const renderTestResult = () => {
    if (!testStatus) return null;

    const configs = {
      testing: {
        type: 'info',
        message: 'Testing connection...',
      },
      success: {
        type: 'success',
        message: t('git.connectionSuccess'),
      },
      error: {
        type: 'error',
        message: t('git.connectionFailed'),
      },
    };

    const config = configs[testStatus];
    return (
      <Alert
        type={config.type}
        message={config.message}
        style={{ marginBottom: 16 }}
        showIcon
      />
    );
  };

  const renderHelpSections = () => {
    if (helpSections.length === 0) return null;

    return (
      <>
        <Divider />
        {helpSections.map((section, index) => (
          <div key={index} style={{ marginBottom: 16 }}>
            <Title level={5}>{section.title}</Title>
            {section.steps ? (
              <ol style={{ paddingLeft: 16, margin: 0 }}>
                {section.steps.map((step, stepIndex) => (
                  <li key={stepIndex} style={{ marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {step}
                    </Text>
                  </li>
                ))}
              </ol>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {section.content}
              </Text>
            )}
          </div>
        ))}
      </>
    );
  };

  return (
    <Modal
      title={
        <Space>
          {icon}
          <span>{title}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={width}
      className={`config-modal ${className}`}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {cancelText || t('common.cancel')}
        </Button>,
        ...(onTest
          ? [
              <Button
                key="test"
                onClick={handleTest}
                loading={testLoading || testStatus === 'testing'}
                disabled={loading}
              >
                {t('git.testConnection')}
              </Button>,
            ]
          : []),
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          loading={loading}
        >
          {okText || t('common.save')}
        </Button>,
      ]}
    >
      {description && (
        <Alert
          type="info"
          message={description}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      {renderTestResult()}

      <Form form={form} layout="vertical" requiredMark={false}>
        {children}
      </Form>

      {renderHelpSections()}
    </Modal>
  );
};

export default ConfigModal;
