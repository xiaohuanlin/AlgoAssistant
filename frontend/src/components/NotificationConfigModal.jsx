import React, { useEffect, useState } from 'react';
import { Form, Input, Switch, Select, Collapse, message } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import configService from '../services/configService';
import ConfigModal from './common/ConfigModal';

const { Panel } = Collapse;

const NotificationConfigModal = ({
  visible,
  onCancel,
  onSuccess,
  initialValues,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const frequencyOptions = [
    { value: 'daily', label: t('notificationConfig.frequencyDaily') },
    { value: 'weekly', label: t('notificationConfig.frequencyWeekly') },
  ];

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(
        initialValues?.notification_config || {
          email: { enabled: false, settings: {}, frequency: 'daily' },
          push: { enabled: false, settings: {}, frequency: 'daily' },
          sms: { enabled: false, settings: {}, frequency: 'daily' },
        },
      );
    }
  }, [visible, initialValues, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const enabledChannels = ['email', 'push', 'sms'].filter(
        (channel) => values[channel]?.enabled === true,
      );

      for (const channel of enabledChannels) {
        const channelData = values[channel];
        if (!channelData || !channelData.settings) continue;

        const settings = channelData.settings;

        if (channel === 'email') {
          if (!settings.email) {
            message.error(t('notificationConfig.emailRequired'));
            return;
          }
          if (!settings.smtp_server) {
            message.error(t('notificationConfig.smtpServerRequired'));
            return;
          }
          if (!settings.smtp_port) {
            message.error(t('notificationConfig.smtpPortRequired'));
            return;
          }
          if (!settings.password) {
            message.error(t('notificationConfig.emailPasswordRequired'));
            return;
          }
        } else if (channel === 'push') {
          if (!settings.device_token) {
            message.error(t('notificationConfig.deviceTokenRequired'));
            return;
          }
          if (!settings.platform) {
            message.error(t('notificationConfig.platformRequired'));
            return;
          }
        } else if (channel === 'sms') {
          if (!settings.phone_number) {
            message.error(t('notificationConfig.phoneNumberRequired'));
            return;
          }
          if (!settings.provider) {
            message.error(t('notificationConfig.providerRequired'));
            return;
          }
        }

        if (!channelData.frequency) {
          message.error(t('notificationConfig.frequencyRequired'));
          return;
        }
      }

      const notification_config = enabledChannels.reduce((acc, channel) => {
        acc[channel] = values[channel];
        return acc;
      }, {});

      await configService.updateConfigs({
        notification_config:
          Object.keys(notification_config).length === 0
            ? null
            : notification_config,
      });
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
      title: t('notificationConfig.instructionsTitle'),
      steps: [
        t('notificationConfig.instruction1'),
        t('notificationConfig.instruction2'),
        t('notificationConfig.instruction3'),
        t('notificationConfig.instruction4'),
        t('notificationConfig.instruction5'),
        t('notificationConfig.instruction6'),
      ],
    },
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
          <Form.Item
            name={['email', 'enabled']}
            label={t('notificationConfig.enabled')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name={['email', 'settings', 'email']}
            label={t('notificationConfig.emailAddress')}
            rules={[
              {
                type: 'email',
                message: t('notificationConfig.emailRequired'),
              },
            ]}
          >
            <Input
              placeholder={t('notificationConfig.emailAddressPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            name={['email', 'settings', 'smtp_server']}
            label={t('notificationConfig.smtpServer')}
          >
            <Input
              placeholder={t('notificationConfig.smtpServerPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            name={['email', 'settings', 'smtp_port']}
            label={t('notificationConfig.smtpPort')}
          >
            <Input
              type="number"
              placeholder={t('notificationConfig.smtpPortPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            name={['email', 'settings', 'password']}
            label={t('notificationConfig.emailPassword')}
          >
            <Input.Password
              placeholder={t('notificationConfig.emailPasswordPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            name={['email', 'frequency']}
            label={t('notificationConfig.frequency')}
          >
            <Select options={frequencyOptions} />
          </Form.Item>
        </Panel>
        <Panel header={t('notificationConfig.push')} key="push">
          <Form.Item
            name={['push', 'enabled']}
            label={t('notificationConfig.enabled')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name={['push', 'settings', 'device_token']}
            label={t('notificationConfig.deviceToken')}
          >
            <Input
              placeholder={t('notificationConfig.deviceTokenPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            name={['push', 'settings', 'platform']}
            label={t('notificationConfig.platform')}
          >
            <Select
              options={[
                { value: 'ios', label: t('notificationConfig.platformIOS') },
                {
                  value: 'android',
                  label: t('notificationConfig.platformAndroid'),
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name={['push', 'frequency']}
            label={t('notificationConfig.frequency')}
          >
            <Select options={frequencyOptions} />
          </Form.Item>
        </Panel>
        <Panel header={t('notificationConfig.sms')} key="sms">
          <Form.Item
            name={['sms', 'enabled']}
            label={t('notificationConfig.enabled')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name={['sms', 'settings', 'phone_number']}
            label={t('notificationConfig.phoneNumber')}
          >
            <Input
              placeholder={t('notificationConfig.phoneNumberPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            name={['sms', 'settings', 'provider']}
            label={t('notificationConfig.provider')}
          >
            <Select
              options={[
                {
                  value: 'twilio',
                  label: t('notificationConfig.providerTwilio'),
                },
                {
                  value: 'aliyun',
                  label: t('notificationConfig.providerAliyun'),
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name={['sms', 'frequency']}
            label={t('notificationConfig.frequency')}
          >
            <Select options={frequencyOptions} />
          </Form.Item>
        </Panel>
      </Collapse>
    </ConfigModal>
  );
};

export default NotificationConfigModal;
