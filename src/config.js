/**
 * Application Configuration
 * 
 * This file contains configuration settings for the application.
 * Environment-specific values are handled through process.env variables
 * with fallbacks to development defaults.
 */

// API Base URL - defaults to local development server
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// File Upload URL - where uploaded files are stored
export const UPLOAD_URL = process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5000/uploads';

// Application Environment
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Is Production Environment
export const IS_PRODUCTION = NODE_ENV === 'production';

// Is Development Environment
export const IS_DEVELOPMENT = NODE_ENV === 'development';

// Is Test Environment
export const IS_TEST = NODE_ENV === 'test';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// Image upload size limits (in bytes)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed image types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Authentication token storage key
export const TOKEN_STORAGE_KEY = 'token';

// User data storage key
export const USER_STORAGE_KEY = 'user';

// Currency symbol
export const CURRENCY_SYMBOL = 'Rs.';

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Website name
export const SITE_NAME = process.env.REACT_APP_SITE_NAME || 'Gossip E-Commerce';

// Support email
export const SUPPORT_EMAIL = process.env.REACT_APP_SUPPORT_EMAIL || 'support@gossip-commerce.com';

// Theme settings
export const THEME = {
  primaryColor: '#3f51b5',
  secondaryColor: '#f50057',
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  borderRadius: '4px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
};

// Social media links
export const SOCIAL_MEDIA = {
  facebook: process.env.REACT_APP_FACEBOOK_URL || 'https://facebook.com',
  twitter: process.env.REACT_APP_TWITTER_URL || 'https://twitter.com',
  instagram: process.env.REACT_APP_INSTAGRAM_URL || 'https://instagram.com',
  youtube: process.env.REACT_APP_YOUTUBE_URL || 'https://youtube.com'
};

// Default export with all configuration
export default {
  API_URL,
  UPLOAD_URL,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  CURRENCY_SYMBOL,
  DEFAULT_LANGUAGE,
  SITE_NAME,
  SUPPORT_EMAIL,
  THEME,
  SOCIAL_MEDIA
}; 