/**
 * Notification service for handling toast notifications and alerts
 * This service can be customized to use any notification library
 * (e.g., react-toastify, react-hot-toast, or custom implementation)
 */

// Default notification options
const DEFAULT_OPTIONS = {
  duration: 5000, // 5 seconds
  position: 'top-right',
  closeButton: true,
  pauseOnHover: true
};

// Default notification types
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Implementation depends on the notification library being used
// Replace this with the actual implementation you choose
// This is a simple implementation that logs to console and returns functions
let notifyImplementation = null;

/**
 * Initialize the notification service with a specific library implementation
 * @param {Object} implementation - The notification implementation to use
 */
export const initializeNotifications = (implementation) => {
  notifyImplementation = implementation;
};

/**
 * Show a success notification
 * @param {string} message - The notification message
 * @param {Object} options - Additional options for the notification
 */
export const notifySuccess = (message, options = {}) => {
  if (!notifyImplementation) {
    console.log('[SUCCESS]', message);
    return;
  }
  
  notifyImplementation.success(message, {
    ...DEFAULT_OPTIONS,
    ...options,
    type: NOTIFICATION_TYPES.SUCCESS
  });
};

/**
 * Show an error notification
 * @param {string} message - The notification message
 * @param {Object} options - Additional options for the notification
 */
export const notifyError = (message, options = {}) => {
  if (!notifyImplementation) {
    console.error('[ERROR]', message);
    return;
  }
  
  notifyImplementation.error(message, {
    ...DEFAULT_OPTIONS,
    ...options,
    type: NOTIFICATION_TYPES.ERROR
  });
};

/**
 * Show a warning notification
 * @param {string} message - The notification message
 * @param {Object} options - Additional options for the notification
 */
export const notifyWarning = (message, options = {}) => {
  if (!notifyImplementation) {
    console.warn('[WARNING]', message);
    return;
  }
  
  notifyImplementation.warning(message, {
    ...DEFAULT_OPTIONS,
    ...options,
    type: NOTIFICATION_TYPES.WARNING
  });
};

/**
 * Show an info notification
 * @param {string} message - The notification message
 * @param {Object} options - Additional options for the notification
 */
export const notifyInfo = (message, options = {}) => {
  if (!notifyImplementation) {
    console.info('[INFO]', message);
    return;
  }
  
  notifyImplementation.info(message, {
    ...DEFAULT_OPTIONS,
    ...options,
    type: NOTIFICATION_TYPES.INFO
  });
};

/**
 * Show a custom notification with specific type
 * @param {string} type - The notification type
 * @param {string} message - The notification message
 * @param {Object} options - Additional options for the notification
 */
export const notify = (type, message, options = {}) => {
  if (!notifyImplementation) {
    console.log(`[${type.toUpperCase()}]`, message);
    return;
  }
  
  if (notifyImplementation[type]) {
    notifyImplementation[type](message, {
      ...DEFAULT_OPTIONS,
      ...options,
      type
    });
  } else {
    notifyImplementation.custom(message, {
      ...DEFAULT_OPTIONS,
      ...options,
      type
    });
  }
};

/**
 * Show a confirmation dialog
 * @param {string} message - The confirmation message
 * @param {string} title - The dialog title
 * @param {Object} options - Additional options for the dialog
 * @returns {Promise} A promise that resolves with the user's choice
 */
export const confirmDialog = (message, title = 'Confirm', options = {}) => {
  if (!notifyImplementation || !notifyImplementation.confirm) {
    // Fallback to browser confirm if no implementation
    return new Promise((resolve) => {
      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  }
  
  return notifyImplementation.confirm(message, title, options);
};

/**
 * Show a prompt dialog
 * @param {string} message - The prompt message
 * @param {string} title - The dialog title
 * @param {Object} options - Additional options for the dialog
 * @returns {Promise} A promise that resolves with the user's input
 */
export const promptDialog = (message, title = 'Input', options = {}) => {
  if (!notifyImplementation || !notifyImplementation.prompt) {
    // Fallback to browser prompt if no implementation
    return new Promise((resolve) => {
      const input = window.prompt(message);
      resolve(input);
    });
  }
  
  return notifyImplementation.prompt(message, title, options);
};

/**
 * Show an alert dialog
 * @param {string} message - The alert message
 * @param {string} title - The dialog title
 * @param {Object} options - Additional options for the dialog
 * @returns {Promise} A promise that resolves when the dialog is closed
 */
export const alertDialog = (message, title = 'Alert', options = {}) => {
  if (!notifyImplementation || !notifyImplementation.alert) {
    // Fallback to browser alert if no implementation
    return new Promise((resolve) => {
      window.alert(message);
      resolve();
    });
  }
  
  return notifyImplementation.alert(message, title, options);
};

/**
 * Dismiss all notifications
 */
export const dismissAll = () => {
  if (!notifyImplementation || !notifyImplementation.dismissAll) {
    return;
  }
  
  notifyImplementation.dismissAll();
};

/**
 * Dismiss a specific notification by ID
 * @param {string|number} id - The notification ID
 */
export const dismiss = (id) => {
  if (!notifyImplementation || !notifyImplementation.dismiss) {
    return;
  }
  
  notifyImplementation.dismiss(id);
};

/**
 * Handle API error responses and show appropriate notifications
 * @param {Error} error - The error object from an API call
 * @param {string} defaultMessage - Default message to show if error doesn't have a message
 */
export const handleApiError = (error, defaultMessage = 'An error occurred. Please try again.') => {
  // Get error message from response
  const errorMessage = error?.response?.data?.message || 
                     error?.message || 
                     defaultMessage;
  
  // Show notification
  notifyError(errorMessage);
  
  // Log error to console
  console.error('API Error:', error);
};

// Export the notification types for convenience
export const NotificationType = NOTIFICATION_TYPES;

export default {
  initializeNotifications,
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
  NotificationType: NOTIFICATION_TYPES
}; 