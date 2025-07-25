import React, { useState } from 'react';
import { Card, Button } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { useResponsive } from '../../hooks/useResponsive';
import './CollapsibleCard.css';

const CollapsibleCard = ({
  title,
  children,
  defaultExpanded = true,
  priority = 'important',
  extra = null,
  loading = false,
  className = ''
}) => {
  const { isMobile, touchTargetSize } = useResponsive();
  const [expanded, setExpanded] = useState(isMobile ? (priority === 'critical') : defaultExpanded);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const renderMobileHeader = () => (
    <div className="collapsible-header-mobile">
      <span className="collapsible-title-mobile">{title}</span>
      <div className="collapsible-actions-mobile">
        {extra}
        <Button
          type="text"
          size="small"
          icon={expanded ? <UpOutlined /> : <DownOutlined />}
          onClick={handleToggle}
          className="expand-button-mobile"
          style={touchTargetSize}
        />
      </div>
    </div>
  );

  const renderDesktopHeader = () => (
    <div className="collapsible-header-desktop">
      <span className="collapsible-title-desktop">{title}</span>
      {extra && <div className="collapsible-extra-desktop">{extra}</div>}
    </div>
  );

  const getCardClass = () => {
    const baseClass = `collapsible-card priority-${priority}`;
    const layoutClass = isMobile ? 'mobile' : 'desktop';
    const expandedClass = expanded ? 'expanded' : 'collapsed';
    return `${baseClass} ${layoutClass} ${expandedClass} ${className}`;
  };

  return (
    <Card
      className={getCardClass()}
      title={isMobile ? renderMobileHeader() : renderDesktopHeader()}
      bordered={false}
      loading={loading}
      style={{ marginBottom: isMobile ? 12 : 24 }}
    >
      <div
        className={`collapsible-content ${expanded ? 'visible' : 'hidden'}`}
        style={{ display: (expanded || !isMobile) ? 'block' : 'none' }}
      >
        {children}
      </div>
    </Card>
  );
};

export default CollapsibleCard;
