import React from 'react';
import { Button, Dropdown, Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

/**
 * Enhanced Language Switcher Component
 * Provides multiple UI modes for language switching
 * @param {string} mode - UI mode: 'dropdown' (default) or 'select'
 * @param {object} style - Custom styles
 */
const LanguageSwitcher = ({ mode = 'dropdown', style = {} }) => {
  const { i18n, t } = useTranslation();

  const languages = [
    { key: 'en', label: t('language.en') },
    { key: 'zh', label: t('language.zh') },
  ];

  const handleLanguageChange = (value) => {
    i18n.changeLanguage(value);
  };

  if (mode === 'select') {
    return (
      <Select
        value={i18n.language}
        onChange={handleLanguageChange}
        style={{ width: 120, ...style }}
        suffixIcon={<GlobalOutlined />}
      >
        {languages.map((lang) => (
          <Select.Option key={lang.key} value={lang.key}>
            {lang.label}
          </Select.Option>
        ))}
      </Select>
    );
  }

  // Default dropdown mode
  const dropdownItems = languages.map((lang) => ({
    key: lang.key,
    label: lang.label,
    onClick: () => handleLanguageChange(lang.key),
  }));

  return (
    <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
      <Button type="text" icon={<GlobalOutlined />} style={style} />
    </Dropdown>
  );
};

export default LanguageSwitcher;
