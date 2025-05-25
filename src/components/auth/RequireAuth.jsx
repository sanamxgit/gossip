import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  if (!user) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

export default RequireAuth; 