import React from 'react';
import { Button } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  ReloadOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const ActionButton = ({
  type = 'view',
  variant = 'primary',
  size = 'small',
  onClick,
  disabled = false,
  loading = false,
  children,
  className,
  style,
  ...props
}) => {
  const { t } = useTranslation();

  const getButtonConfig = () => {
    const configs = {
      view: {
        icon: <EyeOutlined />,
        text: t('common.view') || 'View',
        type: 'primary'
      },
      edit: {
        icon: <EditOutlined />,
        text: t('common.edit') || 'Edit',
        type: 'default'
      },
      delete: {
        icon: <DeleteOutlined />,
        text: t('common.delete') || 'Delete',
        type: 'default',
        danger: true
      },
      download: {
        icon: <DownloadOutlined />,
        text: t('common.download') || 'Download',
        type: 'default'
      },
      link: {
        icon: <LinkOutlined />,
        text: t('common.open') || 'Open',
        type: 'link'
      },
      run: {
        icon: <PlayCircleOutlined />,
        text: t('common.run') || 'Run',
        type: 'primary'
      },
      add: {
        icon: <PlusOutlined />,
        text: t('common.add') || 'Add',
        type: 'primary'
      },
      save: {
        icon: <SaveOutlined />,
        text: t('common.save') || 'Save',
        type: 'primary'
      },
      refresh: {
        icon: <ReloadOutlined />,
        text: t('common.refresh') || 'Refresh',
        type: 'default'
      },
      review: {
        icon: <BookOutlined />,
        text: t('common.review') || 'Review',
        type: 'default'
      }
    };

    return configs[type] || configs.view;
  };

  const config = getButtonConfig();
  const buttonType = variant !== 'primary' ? variant : config.type;

  return (
    <Button
      type={buttonType}
      size={size}
      icon={config.icon}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      danger={config.danger}
      className={className}
      style={style}
      {...props}
    >
      {children || config.text}
    </Button>
  );
};

export default ActionButton;
