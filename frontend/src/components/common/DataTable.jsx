import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useDebounce from '../../hooks/useDebounce';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const DataTable = ({
  title,
  subtitle,
  data = [],
  columns = [],
  loading = false,
  pagination = {},
  filters = [],
  searchConfig = null,
  actions = [],
  selectedRowKeys = [],
  onSelectionChange,
  onRefresh,
  onFilterChange,
  onClearFilters,
  error = null,
  extra = null,
  className = '',
  size = 'middle',
  rowKey = 'id',
  showFilterButtons = true,
}) => {
  const { t } = useTranslation();
  const [inputValues, setInputValues] = useState({});
  const [searchInputValue, setSearchInputValue] = useState('');

  // Create debounced values for search
  const debouncedSearchValue = useDebounce(searchInputValue, 500);

  // Create debounced values for all input values at once
  const debouncedInputValues = useDebounce(inputValues, 500);

  // Handle debounced input changes
  useEffect(() => {
    filters.forEach((filter) => {
      if (filter.type === 'input' && filter.onChange) {
        const debouncedValue = debouncedInputValues[filter.key] || '';
        if (debouncedValue !== (filter.value || '')) {
          filter.onChange(debouncedValue);
        }
      }
    });
  }, [debouncedInputValues, filters]);

  // Handle debounced search changes
  useEffect(() => {
    if (
      searchConfig &&
      searchConfig.onChange &&
      debouncedSearchValue !== (searchConfig.value || '')
    ) {
      searchConfig.onChange(debouncedSearchValue);
    }
  }, [debouncedSearchValue, searchConfig]);

  const handleInputChange = (key, value) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
    // Only set the input value, let the debounced useEffect handle the onChange call
  };

  const renderFilters = () => {
    if (filters.length === 0) return null;

    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {filters.map((filter, index) => (
            <Col key={filter.key || index} xs={24} sm={12} md={8} lg={6}>
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, marginBottom: 4, display: 'block' }}
                >
                  {filter.label}
                </Text>
                {filter.type === 'input' && (
                  <Input
                    placeholder={filter.placeholder}
                    value={
                      inputValues[filter.key] !== undefined
                        ? inputValues[filter.key]
                        : filter.value || ''
                    }
                    onChange={(e) =>
                      handleInputChange(filter.key, e.target.value)
                    }
                    allowClear
                    onClear={() => handleInputChange(filter.key, '')}
                  />
                )}
                {filter.type === 'select' && (
                  <Select
                    placeholder={filter.placeholder}
                    value={filter.value}
                    onChange={filter.onChange}
                    allowClear
                    style={{ width: '100%' }}
                    options={filter.options}
                  />
                )}
                {filter.type === 'multiSelect' && (
                  <Select
                    mode="multiple"
                    placeholder={filter.placeholder}
                    value={filter.value}
                    onChange={filter.onChange}
                    allowClear
                    style={{ width: '100%' }}
                    options={filter.options}
                  />
                )}
                {filter.type === 'dateRange' && (
                  <RangePicker
                    value={filter.value}
                    onChange={filter.onChange}
                    style={{ width: '100%' }}
                    size="middle"
                    placeholder={filter.placeholder}
                  />
                )}
              </div>
            </Col>
          ))}
          {!showFilterButtons && (
            <Col xs={24} sm={12} md={8} lg={6}>
              <div style={{ paddingTop: 16 }}>
                <Button
                  onClick={() => {
                    // Clear input values in DataTable component
                    setInputValues({});
                    setSearchInputValue('');

                    if (onClearFilters) {
                      onClearFilters();
                    } else {
                      // Fallback to individual filter clearing
                      filters.forEach((filter) => {
                        if (filter.onClear) {
                          filter.onClear();
                        } else if (filter.onChange) {
                          filter.onChange(
                            filter.type === 'select' ? undefined : '',
                          );
                        }
                      });
                      if (onFilterChange) {
                        onFilterChange();
                      }
                    }
                  }}
                >
                  {t('records.clearFilters')}
                </Button>
              </div>
            </Col>
          )}
          {showFilterButtons && (
            <Col xs={24} sm={12} md={8} lg={6}>
              <div style={{ paddingTop: 16 }}>
                <Space>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => onFilterChange && onFilterChange()}
                  >
                    {t('common.filter')}
                  </Button>
                  <Button
                    onClick={() => {
                      // Clear input values in DataTable component
                      setInputValues({});
                      setSearchInputValue('');

                      if (onClearFilters) {
                        onClearFilters();
                      } else {
                        // Fallback to individual filter clearing
                        filters.forEach((filter) => {
                          if (filter.onClear) {
                            filter.onClear();
                          } else if (filter.onChange) {
                            filter.onChange(undefined);
                          }
                        });
                      }
                    }}
                  >
                    {t('records.clearFilters')}
                  </Button>
                </Space>
              </div>
            </Col>
          )}
        </Row>
      </Card>
    );
  };

  const renderHeader = () => {
    const isMobile = window.innerWidth <= 768;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          marginBottom: 16,
          gap: isMobile ? 12 : 0,
        }}
      >
        <div>
          <Text strong style={{ fontSize: isMobile ? 16 : 18 }}>
            {title}
          </Text>
          {subtitle && (
            <div>
              <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                {subtitle}
              </Text>
            </div>
          )}
        </div>
        <Space
          wrap
          style={{
            justifyContent: isMobile ? 'space-between' : 'flex-end',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {searchConfig && (
            <Input
              placeholder={searchConfig.placeholder}
              prefix={<SearchOutlined />}
              value={
                searchInputValue !== ''
                  ? searchInputValue
                  : searchConfig.value || ''
              }
              onChange={(e) => setSearchInputValue(e.target.value)}
              onPressEnter={searchConfig.onSearch}
              style={{
                width: isMobile ? '100%' : 200,
                minWidth: isMobile ? 200 : 200,
              }}
              allowClear
              onClear={() => setSearchInputValue('')}
            />
          )}
          {onRefresh && (
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
              size={isMobile ? 'small' : 'middle'}
            >
              {!isMobile && t('common.refresh')}
            </Button>
          )}
          {actions.map((action, index) => (
            <Button
              key={index}
              type={action.type || 'default'}
              icon={action.icon}
              onClick={action.onClick}
              loading={action.loading}
              danger={action.danger}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? null : action.text}
            </Button>
          ))}
          {extra}
        </Space>
      </div>
    );
  };

  const rowSelection = onSelectionChange
    ? {
        selectedRowKeys,
        onChange: onSelectionChange,
        preserveSelectedRowKeys: true,
      }
    : null;

  return (
    <div className={`data-table ${className}`} style={{ padding: '0 8px' }}>
      {renderHeader()}
      {renderFilters()}

      {error && (
        <Alert
          type="error"
          message={error}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid #f0f0f0',
        }}
        styles={{ body: { padding: '12px' } }}
      >
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: window.innerWidth > 768,
            showTotal: (total, range) =>
              window.innerWidth > 768
                ? t('review.pagination.showing', {
                    start: range[0],
                    end: range[1],
                    total,
                  })
                : `${range[0]}-${range[1]} / ${total}`,
            simple: window.innerWidth <= 768,
            ...pagination,
          }}
          rowSelection={rowSelection}
          rowKey={rowKey}
          size={size}
          scroll={{ x: true }}
          className={window.innerWidth <= 768 ? 'mobile-table' : ''}
        />
      </Card>
    </div>
  );
};

export default DataTable;
