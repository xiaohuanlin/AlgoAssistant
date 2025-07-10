import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/authService';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    // 重定向到登录页
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default PrivateRoute; 