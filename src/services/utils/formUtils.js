/**
 * Utility functions for form validation and handling
 */

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password validation regex - at least 8 chars, 1 uppercase, 1 lowercase, 1 number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

// URL validation regex
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

// Phone number validation regex (international format)
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validates a password
 * @param {string} password - The password to validate
 * @returns {boolean} True if password is valid
 */
export const isValidPassword = (password) => {
  return PASSWORD_REGEX.test(password);
};

/**
 * Validates a URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if URL is valid
 */
export const isValidUrl = (url) => {
  return URL_REGEX.test(url);
};

/**
 * Validates a phone number
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if phone number is valid
 */
export const isValidPhone = (phone) => {
  return PHONE_REGEX.test(phone);
};

/**
 * Validates that passwords match
 * @param {string} password - The password
 * @param {string} confirmPassword - The confirmation password
 * @returns {boolean} True if passwords match
 */
export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * Checks if a value is empty
 * @param {*} value - The value to check
 * @returns {boolean} True if value is empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Validates form input against provided rules
 * @param {Object} values - Form values object
 * @param {Object} rules - Validation rules object
 * @returns {Object} Validation errors object
 */
export const validateForm = (values, rules) => {
  const errors = {};

  Object.keys(rules).forEach(fieldName => {
    const value = values[fieldName];
    const fieldRules = rules[fieldName];

    // Check required fields
    if (fieldRules.required && isEmpty(value)) {
      errors[fieldName] = fieldRules.requiredMessage || 'This field is required';
      return;
    }

    // Skip other validations if empty and not required
    if (isEmpty(value) && !fieldRules.required) {
      return;
    }

    // Check min length
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[fieldName] = `Must be at least ${fieldRules.minLength} characters`;
      return;
    }

    // Check max length
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[fieldName] = `Must be no more than ${fieldRules.maxLength} characters`;
      return;
    }

    // Check min value
    if (fieldRules.min !== undefined && Number(value) < fieldRules.min) {
      errors[fieldName] = `Must be at least ${fieldRules.min}`;
      return;
    }

    // Check max value
    if (fieldRules.max !== undefined && Number(value) > fieldRules.max) {
      errors[fieldName] = `Must not exceed ${fieldRules.max}`;
      return;
    }

    // Check email format
    if (fieldRules.isEmail && !isValidEmail(value)) {
      errors[fieldName] = fieldRules.emailMessage || 'Please enter a valid email address';
      return;
    }

    // Check password format
    if (fieldRules.isPassword && !isValidPassword(value)) {
      errors[fieldName] = fieldRules.passwordMessage || 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number';
      return;
    }

    // Check URL format
    if (fieldRules.isUrl && !isValidUrl(value)) {
      errors[fieldName] = fieldRules.urlMessage || 'Please enter a valid URL';
      return;
    }

    // Check phone format
    if (fieldRules.isPhone && !isValidPhone(value)) {
      errors[fieldName] = fieldRules.phoneMessage || 'Please enter a valid phone number';
      return;
    }

    // Check matching fields (e.g., password confirmation)
    if (fieldRules.shouldMatch && values[fieldRules.shouldMatch] !== value) {
      errors[fieldName] = fieldRules.matchMessage || `Does not match ${fieldRules.shouldMatch}`;
      return;
    }

    // Custom validation function
    if (fieldRules.validate && typeof fieldRules.validate === 'function') {
      const customError = fieldRules.validate(value, values);
      if (customError) {
        errors[fieldName] = customError;
        return;
      }
    }
  });

  return errors;
};

/**
 * Formats a field value based on a formatting function
 * @param {string} value - The value to format
 * @param {Function} formatter - The formatting function
 * @returns {string} The formatted value
 */
export const formatField = (value, formatter) => {
  if (!formatter || typeof formatter !== 'function') {
    return value;
  }
  return formatter(value);
};

/**
 * Creates a formatter for price inputs
 * @param {string} currency - The currency symbol (default: 'Rs.')
 * @returns {Function} A formatter function
 */
export const createPriceFormatter = (currency = 'Rs.') => {
  return (value) => {
    // Remove non-digit characters except decimal point
    const digits = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = digits.split('.');
    if (parts.length > 2) {
      parts[1] = parts.slice(1).join('');
      return `${currency}${parts[0]}.${parts[1]}`;
    }
    
    // Format with currency symbol
    if (digits.includes('.')) {
      return `${currency}${digits}`;
    }
    
    return digits ? `${currency}${digits}` : '';
  };
};

/**
 * Creates a formatter for phone number inputs
 * @returns {Function} A formatter function
 */
export const createPhoneFormatter = () => {
  return (value) => {
    // Remove non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };
};

/**
 * Handles file input change and validates file type and size
 * @param {Event} event - The change event
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Object} Result object with file, error, and preview URL
 */
export const handleFileChange = (event, allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  const file = event.target.files[0];
  
  if (!file) {
    return { file: null, error: null, previewUrl: null };
  }
  
  // Validate file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      file: null, 
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      previewUrl: null
    };
  }
  
  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { 
      file: null, 
      error: `File is too large. Maximum size is ${maxSizeMB} MB`,
      previewUrl: null
    };
  }
  
  // Create preview URL for images
  const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
  
  return { file, error: null, previewUrl };
};

/**
 * Builds FormData object from values
 * @param {Object} values - Form values
 * @param {Array} fileFields - Names of fields that contain files
 * @returns {FormData} FormData object
 */
export const buildFormData = (values, fileFields = []) => {
  const formData = new FormData();
  
  Object.keys(values).forEach(key => {
    const value = values[key];
    
    // Skip null or undefined values
    if (value === null || value === undefined) {
      return;
    }
    
    // Handle file fields
    if (fileFields.includes(key) && value instanceof File) {
      formData.append(key, value);
      return;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(objKey => {
            formData.append(`${key}[${index}][${objKey}]`, item[objKey]);
          });
        } else {
          formData.append(`${key}[${index}]`, item);
        }
      });
      return;
    }
    
    // Handle objects
    if (typeof value === 'object' && value !== null && !(value instanceof File)) {
      Object.keys(value).forEach(objKey => {
        formData.append(`${key}[${objKey}]`, value[objKey]);
      });
      return;
    }
    
    // Handle primitive values
    formData.append(key, value);
  });
  
  return formData;
};

export default {
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
}; 