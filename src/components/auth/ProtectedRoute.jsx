import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { getDefaultRouteForRole, hasRequiredRole } from '../../utils/authRoles';
import {
  getAccountAccessRoute,
  isApprovedAccountStatus,
  normalizeAccountStatus,
} from '../../utils/accountStatus';
import { hasPermission } from '../../utils/permissions';

const ProtectedRoute = ({ children, roles = [], permission = null }) => {
  const { user, isAuthenticated, blockedStatus } = useAuthStore();
  const location = useLocation();
  const normalizedStatus = normalizeAccountStatus(user?.status || blockedStatus);
  const blockedRoute = getAccountAccessRoute(normalizedStatus);

  if (!isAuthenticated && blockedRoute) {
    return <Navigate to={blockedRoute} state={{ from: location }} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isApprovedAccountStatus(normalizedStatus) && blockedRoute) {
    return <Navigate to={blockedRoute} state={{ from: location }} replace />;
  }

  const fallbackPath = getDefaultRouteForRole(user?.role);

  if (roles.length > 0 && !hasRequiredRole(user?.role, roles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (!hasPermission(user, permission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
