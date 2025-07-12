import React from 'react';
import { Card, Row, Col, Typography, Alert } from 'antd';
import { 
  SettingOutlined, 
  UserOutlined, 
  BookOutlined,
  RobotOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import GitHubAuth from '../components/GitHubAuth';
import LeetCodeConfig from '../components/LeetCodeConfig';

const { Title, Text } = Typography;

const Settings = () => {
    const { t } = useTranslation();
    
    return (
        <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
                <Title level={3} style={{ margin: 0 }}>
                    <SettingOutlined /> {t('settings.title')}
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                    {t('settings.description')}
                </Text>
            </div>

            <Row gutter={[16, 16]}>
                {/* LeetCode Integration */}
                <Col xs={24} lg={12}>
                    <LeetCodeConfig />
                </Col>

                {/* GitHub Integration */}
                <Col xs={24} lg={12}>
                    <GitHubAuth />
                </Col>

                {/* Notion Integration */}
                <Col xs={24} lg={12}>
                    <Card size="small" style={{ height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <BookOutlined style={{ fontSize: '18px', marginRight: '8px', color: '#1890ff' }} />
                            <Title level={5} style={{ margin: 0 }}>{t('settings.notionIntegration')}</Title>
                        </div>
                        
                        <Alert
                            message={t('settings.inDevelopment')}
                            description={t('settings.notionDescription')}
                            type="warning"
                            showIcon
                            icon={<WarningOutlined />}
                            style={{ fontSize: '12px' }}
                        />
                    </Card>
                </Col>

                {/* OpenAI Integration */}
                <Col xs={24} lg={12}>
                    <Card size="small" style={{ height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <RobotOutlined style={{ fontSize: '18px', marginRight: '8px', color: '#1890ff' }} />
                            <Title level={5} style={{ margin: 0 }}>{t('settings.openaiIntegration')}</Title>
                        </div>
                        
                        <Alert
                            message={t('settings.inDevelopment')}
                            description={t('settings.openaiDescription')}
                            type="warning"
                            showIcon
                            icon={<WarningOutlined />}
                            style={{ fontSize: '12px' }}
                        />
                    </Card>
                </Col>

                {/* Account Settings */}
                <Col xs={24} lg={12}>
                    <Card size="small" style={{ height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <UserOutlined style={{ fontSize: '18px', marginRight: '8px', color: '#1890ff' }} />
                            <Title level={5} style={{ margin: 0 }}>{t('settings.accountSettings')}</Title>
                        </div>
                        
                        <Alert
                            message={t('settings.featureInDevelopment')}
                            description={t('settings.accountDescription')}
                            type="info"
                            showIcon
                            icon={<InfoCircleOutlined />}
                            style={{ fontSize: '12px' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Settings; 