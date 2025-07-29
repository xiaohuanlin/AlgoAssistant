import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, message } from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ResponsiveStatCard from '../dashboard/ResponsiveStatCard';
import problemService from '../../services/problemService';

const ProblemBankStatistics = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalProblems: 0,
    easyProblems: 0,
    mediumProblems: 0,
    hardProblems: 0,
    leetcodeProblems: 0,
    customProblems: 0,
    totalAttempts: 0,
    solvedProblems: 0,
    solveRate: 0,
    avgAttempts: 0,
    totalReviews: 0,
    popularTags: []
  });

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const data = await problemService.getProblemBankStats();
      setStatistics({
        totalProblems: data.total_problems || 0,
        easyProblems: data.easy_problems || 0,
        mediumProblems: data.medium_problems || 0,
        hardProblems: data.hard_problems || 0,
        leetcodeProblems: data.leetcode_problems || 0,
        customProblems: data.custom_problems || 0,
        totalAttempts: data.total_attempts || 0,
        solvedProblems: data.solved_problems || 0,
        solveRate: data.solve_rate || 0,
        avgAttempts: data.avg_attempts || 0,
        totalReviews: data.total_reviews || 0,
        popularTags: data.popular_tags || []
      });
    } catch (error) {
      console.error('Failed to fetch problem bank statistics:', error);
      message.error(t('problem.bankStatisticsLoadError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatSolveRate = (rate) => {
    if (statistics.totalProblems === 0) return 0;
    return Math.round(rate * 100);
  };


  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="problem-bank-statistics" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        {/* Total Problems */}
        <Col xs={24} sm={12} md={6}>
          <ResponsiveStatCard
            title={t('problem.totalProblems')}
            value={statistics.totalProblems}
            prefix={<BookOutlined />}
            color="#1890ff"
            loading={loading}
          />
        </Col>

        {/* Solved Problems */}
        <Col xs={24} sm={12} md={6}>
          <ResponsiveStatCard
            title={t('problem.solvedProblems')}
            value={statistics.solvedProblems}
            prefix={<CheckCircleOutlined />}
            color="#52c41a"
            loading={loading}
          />
        </Col>

        {/* Solve Rate */}
        <Col xs={24} sm={12} md={6}>
          <ResponsiveStatCard
            title={t('problem.solveRate')}
            value={formatSolveRate(statistics.solveRate)}
            suffix="%"
            prefix={<TrophyOutlined />}
            color={statistics.solveRate >= 0.7 ? "#52c41a" : statistics.solveRate >= 0.4 ? "#faad14" : "#f5222d"}
            loading={loading}
          />
        </Col>

        {/* Total Attempts */}
        <Col xs={24} sm={12} md={6}>
          <ResponsiveStatCard
            title={t('problem.totalAttempts')}
            value={statistics.totalAttempts}
            prefix={<FireOutlined />}
            color="#fa8c16"
            loading={loading}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ProblemBankStatistics;
