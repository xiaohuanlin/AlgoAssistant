import React from 'react';
import { Card, Statistic } from 'antd';
import { useResponsive } from '../../hooks/useResponsive';
import './ResponsiveStatCard.css';

const ResponsiveStatCard = ({
  title,
  value,
  prefix,
  suffix,
  color = '#1890ff',
  trend = null,
  loading = false,
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();

  const getCardBodyStyle = () => {
    if (isMobile) {
      return { padding: '16px' };
    }
    if (isTablet) {
      return { padding: '20px' };
    }
    return { padding: '24px' };
  };

  const getValueStyle = () => {
    const baseStyle = { color };

    if (isMobile) {
      return { ...baseStyle, fontSize: '24px', fontWeight: 700 };
    }
    if (isTablet) {
      return { ...baseStyle, fontSize: '28px', fontWeight: 700 };
    }
    return { ...baseStyle, fontSize: '32px', fontWeight: 700 };
  };

  const getTitleStyle = () => {
    if (isMobile) {
      return { fontSize: '14px', marginBottom: '8px' };
    }
    return { fontSize: '16px', marginBottom: '12px' };
  };

  const renderMobileLayout = () => (
    <div className="stat-content-mobile">
      <div className="stat-header-mobile">
        {prefix && <span className="stat-icon-mobile" style={{ color }}>{prefix}</span>}
        <span className="stat-title-mobile" style={getTitleStyle()}>{title}</span>
      </div>
      <div className="stat-main-mobile">
        <div className="stat-value-mobile" style={getValueStyle()}>
          {value}
          {suffix && <span className="stat-suffix-mobile">{suffix}</span>}
        </div>
        {trend && (
          <div className="stat-trend-mobile">
            <span style={{ color: trend > 0 ? '#52c41a' : '#f5222d' }}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="stat-content-desktop">
      <div className="stat-icon-desktop" style={{ color }}>
        {prefix}
      </div>
      <div className="stat-main-desktop">
        <Statistic
          title={title}
          value={value}
          suffix={suffix}
          valueStyle={getValueStyle()}
          prefix={null}
        />
        {trend && (
          <div className="stat-trend-desktop">
            <span style={{ color: trend > 0 ? '#52c41a' : '#f5222d' }}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card
      className={`responsive-stat-card ${isMobile ? 'mobile' : 'desktop'} ${className}`}
      bodyStyle={getCardBodyStyle()}
      loading={loading}
      bordered={false}
    >
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
    </Card>
  );
};

export default ResponsiveStatCard;
