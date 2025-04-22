import { Navigate } from 'react-router-dom';
import authService from '../api/authService';

/**
 * Higher-order component that requires authentication to access a route
 * If user is not authenticated, redirects to login page
 */
export const RequireAuth = ({ children }) => {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  if (!isAuthenticated()) {
    // Save the current location to redirect back after login
    localStorage.setItem('redirectPath', window.location.pathname);
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Higher-order component that requires specific role to access a route
 * @param {Array} allowedRoles - Array of roles allowed to access the route
 */
export const RequireRole = ({ children, allowedRoles }) => {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || 'customer';
  };

  if (!isAuthenticated()) {
    // Save the current location to redirect back after login
    localStorage.setItem('redirectPath', window.location.pathname);
    return <Navigate to="/login" replace />;
  }

  const userRole = getUserRole();
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

/**
 * Higher-order component that redirects authenticated users away from auth pages
 * For use on login, register pages, etc.
 */
export const RedirectIfAuthenticated = ({ children, redirectTo = '/' }) => {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  if (isAuthenticated()) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

/**
 * Function to validate token on application startup
 * Removes invalid tokens from storage and redirects if needed
 */
export const validateAuthOnStartup = async () => {
  const token = localStorage.getItem('token');
  
  if (token) {
    try {
      // Verify if token is still valid
      await authService.validateToken();
    } catch (error) {
      console.error('Auth token validation failed:', error);
      // Remove invalid token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};

/**
 * Function to handle redirect after successful login
 * Redirects to saved path or default path
 */
export const getRedirectPath = () => {
  const redirectPath = localStorage.getItem('redirectPath');
  
  // Clear the saved redirect path
  if (redirectPath) {
    localStorage.removeItem('redirectPath');
    return redirectPath;
  }
  
  return '/';
};

/**
 * Function to check if user is a seller or has seller application pending
 */
export const checkSellerStatus = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // If already a seller, return true
    if (user.role === 'seller') {
      return { isSeller: true, isPending: false };
    }
    
    // Check if there's a pending seller application
    const applicationStatus = await authService.checkApplicationStatus();
    return { 
      isSeller: false, 
      isPending: applicationStatus?.status === 'pending',
      application: applicationStatus
    };
  } catch (error) {
    console.error('Error checking seller status:', error);
    return { isSeller: false, isPending: false };
  }
};

/**
 * Function to check if current user is admin
 */
export const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'admin';
};

/**
 * Function to check if current user is seller
 */
export const isSeller = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'seller';
};

/**
 * Function to get current user ID
 */
export const getCurrentUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user._id || null;
};

/**
 * Function to get current user data from local storage
 */
export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user') || '{}');
}; 