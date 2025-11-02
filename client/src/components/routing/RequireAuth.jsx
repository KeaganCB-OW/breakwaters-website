import { useContext, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function RequireAuth({ children, allowedRoles }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const roles = useMemo(() => {
    if (!allowedRoles) {
      return [];
    }

    if (Array.isArray(allowedRoles)) {
      return allowedRoles.filter(Boolean);
    }

    return [allowedRoles].filter(Boolean);
  }, [allowedRoles]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

