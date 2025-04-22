import axios from 'axios';
import { API_URL } from '../../config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${API_URL}`,
});

// Add request interceptor to include JWT token in headers if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const authService = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.role || 'user');
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      console.log('Attempting login with credentials:', credentials);
      const response = await api.post('/api/auth/login', credentials);
      console.log('Login response:', response.data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.role || 'user');
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  },

  // Get current user data
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/api/auth/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/api/auth/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Validate token (used on app startup)
  validateToken: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }
      
      const response = await api.get('/api/auth/validate-token');
      return response.data.valid;
    } catch (error) {
      console.error('Token validation error:', error.response?.data || error.message);
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      return false;
    }
  },

  // Apply to become a seller
  applyForSeller: async (sellerData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(sellerData).forEach(key => {
        if (key !== 'storeImage' && sellerData[key]) {
          formData.append(key, sellerData[key]);
        }
      });
      
      // Add store image if available
      if (sellerData.storeImage) {
        formData.append('storeImage', sellerData.storeImage);
      }
      
      const response = await api.post('/api/auth/seller-application', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Seller application error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Check application status
  checkApplicationStatus: async () => {
    try {
      const response = await api.get('/api/auth/seller-application');
      return response.data;
    } catch (error) {
      console.error('Check application status error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Admin login
  adminLogin: async (credentials) => {
    try {
      const response = await api.post('/api/auth/admin/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', 'admin');
      }
      return response.data;
    } catch (error) {
      console.error('Admin login error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Admin login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  },
  
  // Get user role
  getUserRole: () => {
    return localStorage.getItem('userRole') || null;
  }
};

export default authService; 