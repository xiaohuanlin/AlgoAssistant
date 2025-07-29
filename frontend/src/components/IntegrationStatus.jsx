import React from 'react';
import { Card, List, Badge, Button, Space, Typography, Divider } from 'antd';
import {
  CodeOutlined,
  GithubOutlined,
  BookOutlined,
  RobotOutlined,
  BellOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const IntegrationStatus = ({
  configs = {},
  onConfigureService,
  loading = false
}) => {
  const { t } = useTranslation();

  const integrationServices = [
    {
      key: 'leetcode',
      title: t('settings.leetcodeIntegration') || 'LeetCode Integration',
      icon: <CodeOutlined style={{ color: '#1890ff' }} />,
      description: t('settings.leetcodeDescription') || 'Sync problem records and submission history',
      isConfigured: configs.leetcode_config?.session_cookie,
      configPath: 'leetcode'
    },
    {
      key: 'github',
      title: t('git.title') || 'GitHub Integration',
      icon: <GithubOutlined style={{ color: '#1890ff' }} />,
      description: t('settings.githubDescription') || 'Automatically sync code to Git repository',
      isConfigured: configs.github_config?.repo_url && configs.github_config?.token,
      configPath: 'github'
    },
    {
      key: 'notion',
      title: t('settings.notionIntegration') || 'Notion Integration',
      icon: <BookOutlined style={{ color: '#1890ff' }} />,
      description: t('settings.notionDescription') || 'Sync problem records and AI analysis results',
      isConfigured: configs.notion_config?.token && configs.notion_config?.db_id,
      configPath: 'notion'
    },
    {
      key: 'gemini',
      title: t('gemini.title') || 'Gemini Integration',
      icon: <RobotOutlined style={{ color: '#1890ff' }} />,
      description: t('gemini.description') || 'AI-powered code analysis and improvement suggestions',
      isConfigured: configs.gemini_config?.api_key,
      configPath: 'gemini'
    },
    {
      key: 'notification',
      title: t('settings.notificationSettings') || 'Notification Configuration',
      icon: <BellOutlined style={{ color: '#1890ff' }} />,
      description: t('settings.notificationDescription') || 'Configure email, push, SMS notifications',
      isConfigured: configs.notification_config && (
        configs.notification_config.email?.enabled ||
        configs.notification_config.push?.enabled ||
        configs.notification_config.sms?.enabled
      ),
      configPath: 'notification'
    }
  ];

  const configuredCount = integrationServices.filter(service => service.isConfigured).length;
  const totalCount = integrationServices.length;

  const renderListItem = (item) => (
    <List.Item
      actions={[
        <Button
          type="link"
          icon={<SettingOutlined />}
          onClick={() => onConfigureService(item.configPath)}
          size="small"
        >
          {item.isConfigured ? t('common.configure') : t('common.configure')}
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={item.icon}
        title={
          <Space>
            {item.title}
            <Badge
              status={item.isConfigured ? 'success' : 'default'}
              text={
                <Text type={item.isConfigured ? 'success' : 'secondary'}>
                  {item.isConfigured ?
                    (t('common.configured') || 'Configured') :
                    (t('common.notConfigured') || 'Not Configured')
                  }
                </Text>
              }
            />
          </Space>
        }
        description={
          <Text type="secondary" style={{ fontSize: 12 }}>
            {item.description}
          </Text>
        }
      />
    </List.Item>
  );

  return (
    <Card
      title={
        <Space>
          <SettingOutlined />
          {t('accountSettings.integrationStatus') || 'Integration Services'}
        </Space>
      }
      loading={loading}
      size="small"
    >
      {/* 统计概览 */}
      <div style={{
        background: '#fafafa',
        padding: 16,
        borderRadius: 6,
        marginBottom: 16,
        textAlign: 'center'
      }}>
        <Space split={<Divider type="vertical" />}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
              {configuredCount}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('accountSettings.configuredServices') || 'Configured'}
            </Text>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
              {totalCount}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('accountSettings.totalServices') || 'Total Services'}
            </Text>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#722ed1' }}>
              {Math.round((configuredCount / totalCount) * 100)}%
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('accountSettings.completionRate') || 'Completion'}
            </Text>
          </div>
        </Space>
      </div>

      {/* 服务列表 */}
      <List
        itemLayout="horizontal"
        dataSource={integrationServices}
        renderItem={renderListItem}
        size="small"
      />

      {/* 提示信息 */}
      {configuredCount < totalCount && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#fff7e6',
          border: '1px solid #ffd591',
          borderRadius: 6
        }}>
          <Space>
            <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
            <Text style={{ fontSize: 12 }}>
              {t('accountSettings.configurationTip') ||
                'Configure more services to unlock additional features and improve your workflow efficiency.'}
            </Text>
          </Space>
        </div>
      )}

      {configuredCount === totalCount && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: 6
        }}>
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: 12 }}>
              {t('accountSettings.allConfigured') ||
                'Excellent! All integration services are configured and ready to use.'}
            </Text>
          </Space>
        </div>
      )}
    </Card>
  );
};

export default IntegrationStatus;
