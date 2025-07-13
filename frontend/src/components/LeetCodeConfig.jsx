import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Alert, Typography, message, Space, Row, Col, Statistic } from 'antd';
import { CodeOutlined, InfoCircleOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import leetcodeService from '../services/leetcodeService';

const { Title } = Typography;

const LeetCodeConfig = () => {
    const { t } = useTranslation();
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState(null);
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
            <div style={{ textAlign: 'center', color: '#999' }}>{t('leetcode.noSyncHistory')}</div>
        </Card>
    );
};

export default LeetCodeConfig;
