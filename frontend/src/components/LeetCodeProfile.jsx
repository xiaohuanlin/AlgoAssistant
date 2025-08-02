import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Avatar,
  Spin,
  Alert,
  Button,
} from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  StarOutlined,
  GlobalOutlined,
  CompanyOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import leetcodeService from '../services/leetcodeService';
import configService from '../services/configService';

const { Title, Text } = Typography;

const LeetCodeProfile = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLeetCodeConfig, setHasLeetCodeConfig] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await leetcodeService.getLeetCodeProfile();
      setProfile(response.data);
    } catch (err) {
      setError(err.message || t('leetcode.profileError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const checkLeetCodeConfig = async () => {
      try {
        const leetcodeConfig = await configService.getLeetCodeConfig();
        const hasConfig = leetcodeConfig && leetcodeConfig.session_cookie;
        setHasLeetCodeConfig(hasConfig);

        // Only load LeetCode profile if user has config
        if (hasConfig) {
          loadProfile();
        }
      } catch (error) {
        setHasLeetCodeConfig(false);
      }
    };
    checkLeetCodeConfig();
  }, [loadProfile, t]);

  // If user doesn't have LeetCode config, show configuration message
  if (!hasLeetCodeConfig) {
    return (
      <Card title={t('leetcode.profileTitle')}>
        <Alert
          message={t('leetcode.configRequired')}
          description={t('leetcode.configRequiredDesc')}
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title={t('leetcode.profileTitle')}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>{t('leetcode.profileLoading')}</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title={t('leetcode.profileTitle')}>
        <Alert
          message={t('leetcode.profileError')}
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadProfile}>
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card title={t('leetcode.profileTitle')}>
        <Alert
          message={t('leetcode.profileNoData')}
          description={t('leetcode.profileNoDataDesc')}
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card title={t('leetcode.profileTitle')}>
      <Row gutter={[16, 16]}>
        {/* Basic Information */}
        <Col xs={24} md={12}>
          <Card size="small" title={t('leetcode.basicInformation')}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Avatar
                size={64}
                src={profile.user_avatar}
                icon={<UserOutlined />}
                style={{ marginRight: 16 }}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {profile.real_name || profile.username}
                </Title>
                <Text type="secondary">@{profile.username}</Text>
              </div>
            </div>

            {profile.about_me && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>About:</Text>
                <div style={{ marginTop: 4 }}>
                  <Text>{profile.about_me}</Text>
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* Statistics */}
        <Col xs={24} md={12}>
          <Card size="small" title={t('leetcode.statistics')}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic
                  title={t('leetcode.reputation')}
                  value={profile.reputation || 0}
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={t('leetcode.ranking')}
                  value={profile.ranking || 'N/A'}
                  prefix={<StarOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={t('leetcode.starRating')}
                  value={profile.star_rating || 0}
                  prefix={<StarOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Professional Information */}
        <Col xs={24} md={12}>
          <Card size="small" title={t('leetcode.professionalInformation')}>
            {profile.company && (
              <div style={{ marginBottom: 8 }}>
                <CompanyOutlined style={{ marginRight: 8 }} />
                <Text strong>Company:</Text> {profile.company}
              </div>
            )}
            {profile.school && (
              <div style={{ marginBottom: 8 }}>
                <BankOutlined style={{ marginRight: 8 }} />
                <Text strong>School:</Text> {profile.school}
              </div>
            )}
            {profile.country_name && (
              <div style={{ marginBottom: 8 }}>
                <GlobalOutlined style={{ marginRight: 8 }} />
                <Text strong>Country:</Text> {profile.country_name}
              </div>
            )}
          </Card>
        </Col>

        {/* Skill Tags */}
        <Col xs={24} md={12}>
          <Card size="small" title={t('leetcode.skillTags')}>
            {profile.skill_tags && profile.skill_tags.length > 0 ? (
              <div>
                {profile.skill_tags.map((tag, index) => (
                  <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                    {tag}
                  </Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary">{t('leetcode.noSkillTags')}</Text>
            )}
          </Card>
        </Col>

        {/* Websites */}
        {profile.websites && profile.websites.length > 0 && (
          <Col xs={24}>
            <Card size="small" title={t('leetcode.websites')}>
              <div>
                {profile.websites.map((website, index) => (
                  <div key={index} style={{ marginBottom: 4 }}>
                    <a href={website} target="_blank" rel="noopener noreferrer">
                      {website}
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default LeetCodeProfile;
