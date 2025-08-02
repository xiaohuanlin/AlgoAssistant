import React, { useState, useEffect } from 'react';
import { Card } from 'antd';
import { useTranslation } from 'react-i18next';

const LeetCodeConfig = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Card size="small">
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <div>{t('common.loading')}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card size="small" style={{ height: '100%' }}>
      <div style={{ textAlign: 'center', color: '#999' }}>
        {t('leetcode.noSyncHistory')}
      </div>
    </Card>
  );
};

export default LeetCodeConfig;
