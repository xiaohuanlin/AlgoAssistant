import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const ModernLoading = ({
  size = 'large',
  text = 'Loading...',
  fullScreen = false,
  style = {},
}) => {
  const customIcon = (
    <LoadingOutlined
      style={{
        fontSize: size === 'large' ? 40 : size === 'small' ? 20 : 30,
        color: '#667eea',
      }}
      spin
    />
  );

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    ...(fullScreen
      ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          zIndex: 9999,
        }
      : {
          padding: '40px 20px',
        }),
    ...style,
  };

  const textStyle = {
    color: fullScreen ? 'rgba(255, 255, 255, 0.9)' : '#667eea',
    fontSize: '16px',
    fontWeight: '500',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  };

  return (
    <div style={containerStyle}>
      <Spin indicator={customIcon} />
      {text && <div style={textStyle}>{text}</div>}
    </div>
  );
};

export default ModernLoading;
