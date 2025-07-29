import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, message, Typography, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import problemService from '../services/problemService';
import { useConfig } from '../contexts/ConfigContext';

const { Title } = Typography;
const { Option } = Select;

const ProblemCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('custom');
  const { configs } = useConfig();
  const hasLeetCodeConfig = configs && configs.leetcode_config && configs.leetcode_config.session_cookie;

  const handleSourceChange = (value) => {
    setSource(value);
    form.resetFields(['title', 'title_slug', 'difficulty', 'tags', 'description', 'url']);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // tags: comma separated string to array
      if (values.tags && typeof values.tags === 'string') {
        values.tags = values.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      }
      const data = await problemService.createProblem(values);
      message.success(t('problem.createSuccess'));
      navigate(`/problem/${data.id}`);
    } catch (error) {
      message.error(t('problem.createError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={<Title level={3}>{t('problem.createTitle')}</Title>} style={{ maxWidth: 600, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ source: 'custom' }}
        disabled={source === 'leetcode' && !hasLeetCodeConfig}
      >
        <Form.Item
          name="source"
          label={t('problem.source')}
          rules={[{ required: true }]}
        >
          <Select onChange={handleSourceChange}>
            <Option value="custom">{t('problem.sourceCustom')}</Option>
            <Option value="leetcode">{t('problem.sourceLeetcode')}</Option>
          </Select>
        </Form.Item>
        {source === 'leetcode' && !hasLeetCodeConfig && (
          <div style={{ color: '#faad14', marginBottom: 16 }}>{t('problem.leetcodeConfigHelp')}</div>
        )}
        {source === 'leetcode' ? (
          <Form.Item
            name="url"
            label={t('problem.leetcodeUrl')}
            rules={[{ required: true, type: 'url', message: t('problem.leetcodeUrlRequired') }]}
          >
            <Input placeholder="https://leetcode.com/problems/two-sum/" />
          </Form.Item>
        ) : (
          <>
            <Form.Item name="title" label={t('problem.title')} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="title_slug" label={t('problem.titleSlug')}>
              <Input placeholder={t('problem.titleSlugPlaceholder')} />
            </Form.Item>
            <Form.Item name="difficulty" label={t('problem.difficulty')}>
              <Select allowClear>
                <Option value="Easy">{t('problem.difficultyEasy')}</Option>
                <Option value="Medium">{t('problem.difficultyMedium')}</Option>
                <Option value="Hard">{t('problem.difficultyHard')}</Option>
              </Select>
            </Form.Item>
            <Form.Item name="tags" label={t('problem.tags')}>
              <Input placeholder={t('problem.tagsPlaceholder')} />
            </Form.Item>
            <Form.Item name="description" label={t('problem.description')}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="url" label={t('problem.url')}>
              <Input placeholder="https://..." />
            </Form.Item>
          </>
        )}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>{t('common.create')}</Button>
            <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProblemCreate;
