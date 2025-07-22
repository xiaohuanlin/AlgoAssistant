import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, message, Tag, Typography, Space, Form, Input, Select, Modal, Upload, Switch } from 'antd';
import { BookOutlined, EyeOutlined, PlusOutlined, FilterOutlined, ClearOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import problemService from '../services/problemService';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

const ProblemList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState({ items: [], total: 0 });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [filters, setFilters] = useState({});
  const [form] = Form.useForm();
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importedCount, setImportedCount] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [onlySelf, setOnlySelf] = useState(false);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        ...filters,
        only_self: onlySelf,
      };
      const data = await problemService.getProblems(params);
      setProblems(data);
    } catch (error) {
      message.error(t('problem.loadError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [pagination, filters, onlySelf, t]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleTableChange = (pagination) => {
    setPagination({ current: pagination.current, pageSize: pagination.pageSize });
  };

  const handleFilter = (values) => {
    setFilters(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClearFilters = () => {
    form.resetFields();
    setFilters({});
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleViewDetail = (problem) => {
    navigate(`/problem/${problem.id}`);
  };

  const handleImport = async () => {
    if (!fileList.length) return;
    setImporting(true);
    setImportError(null);
    try {
      const file = fileList[0].originFileObj;
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json)) throw new Error('Invalid format: should be an array');
      await problemService.batchCreateProblems(json);
      setImportedCount(json.length);
      setImportModalVisible(false);
      setFileList([]);
      message.success(t('problem.createSuccess'));
      fetchProblems();
    } catch (error) {
      setImportError(error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleOnlySelfChange = (checked) => {
    setOnlySelf(checked);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const importModal = (
    <Modal
      title={t('problem.batchImport')}
      open={importModalVisible}
      onCancel={() => setImportModalVisible(false)}
      onOk={handleImport}
      confirmLoading={importing}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
    >
      <Upload.Dragger
        accept="application/json"
        fileList={fileList}
        beforeUpload={() => false}
        onRemove={() => setFileList([])}
        onChange={({ fileList }) => setFileList(fileList.slice(-1))}
        maxCount={1}
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">{t('problem.importTip')}</p>
        <p className="ant-upload-hint">{t('problem.importHint')}</p>
      </Upload.Dragger>
      {importError && <div style={{ color: 'red', marginTop: 8 }}>{importError}</div>}
      {importedCount > 0 && <div style={{ color: 'green', marginTop: 8 }}>{t('problem.importedCount', { count: importedCount })}</div>}
    </Modal>
  );

  const difficultyColor = {
    Easy: 'green',
    Medium: 'orange',
    Hard: 'red',
  };
  const sourceColor = {
    leetcode: 'blue',
    custom: 'default',
  };

  const columns = [
    {
      title: t('problem.title'),
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>{text}</Button>
      ),
    },
    {
      title: t('problem.source'),
      dataIndex: 'source',
      key: 'source',
      render: (source) => <Tag color={sourceColor[source] || 'default'} style={{ fontWeight: 500 }}>{source}</Tag>,
    },
    {
      title: t('problem.difficulty'),
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => <Tag color={difficultyColor[difficulty] || 'default'} style={{ fontWeight: 500 }}>{difficulty}</Tag>,
    },
    {
      title: t('problem.tags'),
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => tags && tags.length > 0 ? tags.map(tag => <Tag key={tag}>{tag}</Tag>) : '-',
    },
    {
      title: t('problem.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: t('problem.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>{t('common.view')}</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<Title level={3}><BookOutlined /> {t('problem.listTitle')}</Title>}
      extra={null}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleFilter}
          style={{ flex: 1 }}
        >
          <Form.Item name="title">
            <Input placeholder={t('problem.titlePlaceholder')} allowClear />
          </Form.Item>
          <Form.Item name="source">
            <Select placeholder={t('problem.sourcePlaceholder')} allowClear style={{ width: 120 }}>
              <Option value="leetcode">LeetCode</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </Form.Item>
          <Form.Item name="difficulty">
            <Select placeholder={t('problem.difficultyPlaceholder')} allowClear style={{ width: 120 }}>
              <Option value="Easy">Easy</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Hard">Hard</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>{t('common.filter')}</Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleClearFilters} icon={<ClearOutlined />}>{t('common.clear')}</Button>
          </Form.Item>
        </Form>
        <Space style={{ marginLeft: 16 }}>
          <Switch checked={onlySelf} onChange={handleOnlySelfChange} checkedChildren={t('problem.onlySelf')} unCheckedChildren={t('problem.allUsers')} style={{ marginRight: 8 }} />
          <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>{t('problem.batchImport')}</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/problem/create')}>
            {t('common.create')}
          </Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={problems.items}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: problems.total,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
      />
      {importModal}
    </Card>
  );
};

export default ProblemList;
