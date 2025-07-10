import React from 'react';
import { Button, Dropdown } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const languageItems = [
    {
      key: 'en',
      label: t('language.en'),
      onClick: () => i18n.changeLanguage('en')
    },
    {
      key: 'zh',
      label: t('language.zh'),
      onClick: () => i18n.changeLanguage('zh')
    }
  ];

  return (
    <Dropdown menu={{ items: languageItems }} placement="bottomRight">
      <Button type="text" icon={<GlobalOutlined />} />
    </Dropdown>
  );
};

export default LanguageSwitcher; 