import formUtils from './formUtils';
import notificationService from './notificationService';

// Export individual utilities
export {
  formUtils,
  notificationService
};

// Export named functions from utilities
export const {
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
  buildFormData
} = formUtils;

export const {
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
} = notificationService;

// Export as a combined object
const utils = {
  form: formUtils,
  notification: notificationService
};

export default utils; 