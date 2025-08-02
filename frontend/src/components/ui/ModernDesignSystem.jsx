import React from 'react';
import { Card, Typography } from 'antd';
import './ModernDesignSystem.css';

const { Title, Text } = Typography;

/**
 * Modern Design System Components
 * Reusable components extracted from modern design style based on review plan detail page
 */

// 1. Gradient Page Header Component
export const GradientPageHeader = ({
  icon,
  title,
  subtitle,
  isMobile = false,
  gradient = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
}) => {
  return (
    <div
      className={`gradient-page-header ${isMobile ? 'mobile' : ''}`}
      style={{ background: gradient }}
    >
      {/* Background Decoration */}
      <div className="gradient-decoration gradient-decoration-1" />
      <div className="gradient-decoration gradient-decoration-2" />

      <div className="gradient-header-content">
        {/* Icon Container */}
        <div className="gradient-icon-container">{icon}</div>

        {/* Title */}
        <Title level={isMobile ? 3 : 1} className="gradient-header-title">
          {title}
        </Title>

        {/* Subtitle */}
        {subtitle && <div className="gradient-header-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

// 2. Modern Icon Container Component
export const ModernIconContainer = ({
  icon,
  size = 'medium',
  gradient = 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  isMobile = false,
}) => {
  const sizeClass = isMobile ? `${size}-mobile` : size;

  return (
    <div
      className={`modern-icon-container ${sizeClass}`}
      style={{ background: gradient }}
    >
      {icon}
    </div>
  );
};

// 3. Modern Card Component
export const ModernCard = ({
  title,
  icon,
  iconGradient = 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  children,
  isMobile = false,
  ...props
}) => {
  return (
    <Card
      title={
        <div className={`modern-card-title ${isMobile ? 'mobile' : ''}`}>
          <ModernIconContainer
            icon={icon}
            gradient={iconGradient}
            size="small"
            isMobile={isMobile}
          />
          <span className="modern-card-title-text">{title}</span>
        </div>
      }
      className={`modern-card ${isMobile ? 'mobile' : ''}`}
      {...props}
    >
      {children}
    </Card>
  );
};

// 4. Modern Info Item Component
export const ModernInfoItem = ({
  icon,
  label,
  value,
  iconGradient = 'linear-gradient(135deg, #10b981, #059669)',
  isMobile = false,
  valueComponent = null,
}) => {
  return (
    <div className={`modern-info-item ${isMobile ? 'mobile' : ''}`}>
      <div className="modern-info-header">
        <ModernIconContainer
          icon={icon}
          gradient={iconGradient}
          size="small"
          isMobile={isMobile}
        />
        <Text strong className="modern-info-label">
          {label}
        </Text>
      </div>
      <div className="modern-info-content">
        {valueComponent || <div className="modern-info-value">{value}</div>}
      </div>
    </div>
  );
};

// 5. Gradient Button Component
export const GradientButton = ({
  children,
  gradient = 'linear-gradient(135deg, #10b981, #059669)',
  isMobile = false,
  ...props
}) => {
  return (
    <button
      className={`gradient-button ${isMobile ? 'mobile' : ''}`}
      style={{ background: gradient }}
      {...props}
    >
      {children}
    </button>
  );
};

// 6. Modern Tag Component
export const ModernTag = ({ children, type = 'default', isMobile = false }) => {
  return (
    <span
      className={`modern-tag modern-tag-${type} ${isMobile ? 'mobile' : ''}`}
    >
      {children}
    </span>
  );
};

// Predefined gradient color schemes
export const GRADIENT_THEMES = {
  primary: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  success: 'linear-gradient(135deg, #10b981, #059669)',
  warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
  error: 'linear-gradient(135deg, #ef4444, #dc2626)',
  info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  purple: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  pink: 'linear-gradient(135deg, #ec4899, #be185d)',
  cyan: 'linear-gradient(135deg, #06b6d4, #0891b2)',
  slate: 'linear-gradient(135deg, #64748b, #475569)',
  pageHeader: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
};

const ModernDesignSystem = {
  GradientPageHeader,
  ModernIconContainer,
  ModernCard,
  ModernInfoItem,
  GradientButton,
  ModernTag,
  GRADIENT_THEMES,
};

export default ModernDesignSystem;
