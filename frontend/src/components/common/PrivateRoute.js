import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Enhanced Private Route Component
 * Protects routes that require authentication
 * @param {React.ReactNode} children - Child components to render if authenticated
 * @param {string} redirectTo - Route to redirect to if not authenticated (default: '/login')
 * @param {React.ReactNode} fallback - Loading component while checking authentication
 */
const PrivateRoute = ({
  children,
  redirectTo = '/login',
  fallback = (
    <Spin
      size="large"
      style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh' }}
    />
  ),
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while authentication is being verified
  if (isLoading) {
    return fallback;
  }

  // Redirect to login page if not authenticated
  // Pass current location so user can be redirected back after login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
