import apiServices, { 
  authService, 
  productService,
  categoryService, 
  brandService,
  orderService 
} from './api';

import utils, {
  // Form utilities
  isValidEmail,
  isValidPassword,
  isValidUrl,
  isValidPhone,
  passwordsMatch,
  isEmpty,
  validateForm,
  formatField,
  createPriceFormatter,
  createPhoneFormatter,
  handleFileChange,
  buildFormData,
  
  // Notification utilities
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
  notify,
  confirmDialog,
  promptDialog,
  alertDialog,
  dismissAll,
  dismiss,
  handleApiError,
  initializeNotifications,
  NotificationType
} from './utils';

import {
  // Auth middleware
  RequireAuth,
  RequireRole,
  RedirectIfAuthenticated,
  validateAuthOnStartup,
  getRedirectPath,
  checkSellerStatus,
  isAdmin,
  isSeller,
  getCurrentUserId,
  getCurrentUser
} from './middleware/authMiddleware';

// Export all API services
export {
  // API Services
  apiServices,
  authService,
  productService,
  categoryService,
  brandService,
  orderService,
  
  // Utilities
  utils,
  
  // Form utilities
  isValidEmail,
  isValidPassword,
  isValidUrl,
  isValidPhone,
  passwordsMatch,
  isEmpty,
  validateForm,
  formatField,
  createPriceFormatter,
  createPhoneFormatter,
  handleFileChange,
  buildFormData,
  
  // Notification utilities
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
  notify,
  confirmDialog,
  promptDialog,
  alertDialog,
  dismissAll,
  dismiss,
  handleApiError,
  initializeNotifications,
  NotificationType,
  
  // Auth middleware
  RequireAuth,
  RequireRole,
  RedirectIfAuthenticated,
  validateAuthOnStartup,
  getRedirectPath,
  checkSellerStatus,
  isAdmin,
  isSeller,
  getCurrentUserId,
  getCurrentUser
};

// Default export for all services
const services = {
  api: apiServices,
  utils,
  auth: {
    RequireAuth,
    RequireRole,
    RedirectIfAuthenticated,
    validateAuthOnStartup,
    getRedirectPath,
    checkSellerStatus,
    isAdmin,
    isSeller,
    getCurrentUserId,
    getCurrentUser
  }
};

export default services; 