import React, { useEffect, useState } from 'react';
import { Form, Input, Switch, Select, Collapse, message } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import configService from '../services/configService';
import ConfigModal from './common/ConfigModal';

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

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const notification_config = ["email", "push", "sms"].reduce((acc, channel) => {
        const c = values[channel];
        if (c && c.enabled === true) {
          acc[channel] = c;
        }
        return acc;
      }, {});

      await configService.updateConfigs({ notification_config: Object.keys(notification_config).length === 0 ? null : notification_config });
      message.success(t('notificationConfig.saveSuccess') || 'Save successful');
      onSuccess && onSuccess(notification_config);
      onCancel();
    } catch (error) {
      message.error(t('notificationConfig.saveError') + ': ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const helpSections = [
    {
      title: t('notificationConfig.title') + ' 说明',
      steps: [
        '启用后可通过邮件、推送、短信等方式接收复习提醒、任务到期等通知。',
        '邮件通知需填写有效邮箱、SMTP服务器及授权码。',
        '推送需填写设备Token和平台类型。',
        '短信需填写手机号和服务商。',
        '可设置通知频率（如每日、每周）。',
        '建议优先配置常用渠道，确保能及时收到重要提醒。'
      ]
    }
  ];

  return (
    <ConfigModal
      visible={visible}
      onCancel={onCancel}
      title={t('notificationConfig.title')}
      icon={<BellOutlined />}
      description={t('notificationConfig.description')}
      width={800}
      onSave={handleSave}
      loading={loading}
      form={form}
      helpSections={helpSections}
      okText={t('common.save')}
    >
        <Collapse defaultActiveKey={['email', 'push', 'sms']}>
          <Panel header={t('notificationConfig.email')} key="email">
            <Form.Item name={["email", "enabled"]} label={t('notificationConfig.enabled')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={["email", "settings", "email"]} label={t('notificationConfig.emailAddress')} rules={[{ type: 'email', required: true, message: t('notificationConfig.emailRequired') }]}>
              <Input placeholder={t('notificationConfig.emailAddressPlaceholder')} />
            </Form.Item>
            <Form.Item name={["email", "settings", "smtp_server"]} label={t('notificationConfig.smtpServer')} rules={[{ required: true, message: 'Please enter SMTP server' }]}>
              <Input placeholder={t('notificationConfig.smtpServerPlaceholder')} />
            </Form.Item>
            <Form.Item name={["email", "settings", "smtp_port"]} label={t('notificationConfig.smtpPort')} rules={[{ required: true, message: 'Please enter SMTP port' }]}>
              <Input type="number" placeholder={t('notificationConfig.smtpPortPlaceholder')} />
            </Form.Item>
            <Form.Item name={["email", "settings", "password"]} label={t('notificationConfig.emailPassword')} rules={[{ required: true, message: 'Please enter email password' }]}>
              <Input.Password placeholder={t('notificationConfig.emailPasswordPlaceholder')} />
            </Form.Item>
            <Form.Item name={["email", "frequency"]} label={t('notificationConfig.frequency')} rules={[{ required: true, message: 'Please select frequency' }]}>
              <Select options={frequencyOptions} />
            </Form.Item>
          </Panel>
          <Panel header={t('notificationConfig.push')} key="push">
            <Form.Item name={["push", "enabled"]} label={t('notificationConfig.enabled')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={["push", "settings", "device_token"]} label={t('notificationConfig.deviceToken')} rules={[{ required: true, message: 'Please enter device token' }]}>
              <Input placeholder={t('notificationConfig.deviceTokenPlaceholder')} />
            </Form.Item>
            <Form.Item name={["push", "settings", "platform"]} label={t('notificationConfig.platform')} rules={[{ required: true, message: 'Please select platform' }]}>
              <Select options={[
                { value: 'ios', label: t('notificationConfig.platformIOS') },
                { value: 'android', label: t('notificationConfig.platformAndroid') }
              ]} />
            </Form.Item>
            <Form.Item name={["push", "frequency"]} label={t('notificationConfig.frequency')} rules={[{ required: true, message: 'Please select frequency' }]}>
              <Select options={frequencyOptions} />
            </Form.Item>
          </Panel>
          <Panel header={t('notificationConfig.sms')} key="sms">
            <Form.Item name={["sms", "enabled"]} label={t('notificationConfig.enabled')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name={["sms", "settings", "phone_number"]} label={t('notificationConfig.phoneNumber')} rules={[{ required: true, message: 'Please enter phone number' }]}>
              <Input placeholder={t('notificationConfig.phoneNumberPlaceholder')} />
            </Form.Item>
            <Form.Item name={["sms", "settings", "provider"]} label={t('notificationConfig.provider')} rules={[{ required: true, message: 'Please select provider' }]}>
              <Select options={[
                { value: 'twilio', label: t('notificationConfig.providerTwilio') },
                { value: 'aliyun', label: t('notificationConfig.providerAliyun') }
              ]} />
            </Form.Item>
            <Form.Item name={["sms", "frequency"]} label={t('notificationConfig.frequency')} rules={[{ required: true, message: 'Please select frequency' }]}>
              <Select options={frequencyOptions} />
            </Form.Item>
          </Panel>
        </Collapse>
    </ConfigModal>
  );
};

export default NotificationConfigModal;
