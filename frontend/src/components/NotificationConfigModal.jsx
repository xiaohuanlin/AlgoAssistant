import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Switch, Select, Collapse, message, Alert } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import configService from '../services/configService';

const { Panel } = Collapse;

const NotificationConfigModal = ({ visible, onCancel, onSuccess, initialValues }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const frequencyOptions = [
    { value: 'daily', label: t('notificationConfig.frequencyDaily') },
    { value: 'weekly', label: t('notificationConfig.frequencyWeekly') },
  ];

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialValues?.notification_config || {
        email: { enabled: false, settings: {}, frequency: 'daily' },
        push: { enabled: false, settings: {}, frequency: 'daily' },
        sms: { enabled: false, settings: {}, frequency: 'daily' },
      });
    }
  }, [visible, initialValues, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const notification_config = ["email", "push", "sms"].reduce((acc, channel) => {
        const c = values[channel];
        if (c && c.enabled === true) {
          acc[channel] = c;
        }
        return acc;
      }, {});
      setLoading(true);
      await configService.updateConfigs({ notification_config: Object.keys(notification_config).length === 0 ? null : notification_config });
      message.success(t('notificationConfig.saveSuccess') || 'Save successful');
      onSuccess && onSuccess(notification_config);
      onCancel();
    } catch (error) {
      if (error.errorFields) return;
      message.error(t('notificationConfig.saveError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('notificationConfig.title') || 'Notification Settings'}
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>{t('common.cancel')}</Button>,
        <Button key="save" type="primary" loading={loading} icon={<SaveOutlined />} onClick={() => form.submit()}>{t('common.save')}</Button>
      ]}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={<span dangerouslySetInnerHTML={{ __html: t('notificationConfig.help') }} />}
      />
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        style={{ padding: '20px 0' }}
      >
        <Collapse defaultActiveKey={['email', 'push', 'sms']}>
          <Panel header={t('notificationConfig.email')} key="email">
            <Form.Item name={["email", "enabled"]} label={t('notificationConfig.enabled')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={["email", "settings", "email"]} label={t('notificationConfig.emailAddress')} rules={[{ type: 'email', required: true, message: t('notificationConfig.emailRequired') }]}>
              <Input placeholder={t('notificationConfig.emailAddressPlaceholder')} />
            </Form.Item>
            <Form.Item name={["email", "settings", "smtp_server"]} label={t('notificationConfig.smtpServer')}>
              <Input placeholder={t('notificationConfig.smtpServerPlaceholder')} />
            </Form.Item>
            <Form.Item name={["email", "settings", "smtp_port"]} label={t('notificationConfig.smtpPort')}>
              <Input type="number" placeholder={t('notificationConfig.smtpPortPlaceholder')} />
            </Form.Item>
            <Form.Item name={["email", "settings", "password"]} label={t('notificationConfig.emailPassword')}>
              <Input.Password placeholder={t('notificationConfig.emailPasswordPlaceholder')} />
            </Form.Item>
            <Form.Item name={["email", "frequency"]} label={t('notificationConfig.frequency')}>
              <Select options={frequencyOptions} />
            </Form.Item>
          </Panel>
          <Panel header={t('notificationConfig.push')} key="push">
            <Form.Item name={["push", "enabled"]} label={t('notificationConfig.enabled')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={["push", "settings", "device_token"]} label={t('notificationConfig.deviceToken')}>
              <Input placeholder={t('notificationConfig.deviceTokenPlaceholder')} />
            </Form.Item>
            <Form.Item name={["push", "settings", "platform"]} label={t('notificationConfig.platform')}>
              <Select options={[
                { value: 'ios', label: t('notificationConfig.platformIOS') },
                { value: 'android', label: t('notificationConfig.platformAndroid') }
              ]} />
            </Form.Item>
            <Form.Item name={["push", "frequency"]} label={t('notificationConfig.frequency')}>
              <Select options={frequencyOptions} />
            </Form.Item>
          </Panel>
          <Panel header={t('notificationConfig.sms')} key="sms">
            <Form.Item name={["sms", "enabled"]} label={t('notificationConfig.enabled')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={["sms", "settings", "phone_number"]} label={t('notificationConfig.phoneNumber')}>
              <Input placeholder={t('notificationConfig.phoneNumberPlaceholder')} />
            </Form.Item>
            <Form.Item name={["sms", "settings", "provider"]} label={t('notificationConfig.provider')}>
              <Select options={[
                { value: 'twilio', label: t('notificationConfig.providerTwilio') },
                { value: 'aliyun', label: t('notificationConfig.providerAliyun') }
              ]} />
            </Form.Item>
            <Form.Item name={["sms", "frequency"]} label={t('notificationConfig.frequency')}>
              <Select options={frequencyOptions} />
            </Form.Item>
          </Panel>
        </Collapse>
      </Form>
    </Modal>
  );
};

export default NotificationConfigModal;
