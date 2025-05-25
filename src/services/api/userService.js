import axios from 'axios';
import { API_URL } from '../../config';

// Create an axios instance for user endpoints
const userApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const userService = {
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await userApi.get('/api/users/auth/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by ID (admin only)
  getUserById: async (userId) => {
    try {
      const response = await userApi.get(`/api/users/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Update user (admin only)
  updateUser: async (userId, userData) => {
    try {
      const response = await userApi.put(`/api/users/auth/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    try {
      const response = await userApi.delete(`/api/users/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Change user role (admin only)
  changeUserRole: async (userId, role) => {
    try {
      const response = await userApi.patch(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error changing user role:', error);
      throw error;
    }
  },

  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await userApi.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (userData) => {
    try {
      // Use FormData to handle profile image upload
      const formData = new FormData();
      
      Object.keys(userData).forEach(key => {
        if (key === 'profileImage' && userData.profileImage instanceof File) {
          formData.append('profileImage', userData.profileImage);
        } else {
          formData.append(key, userData[key]);
        }
      });
      
      const response = await userApi.put('/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Change email
  changeEmail: async (newEmail, password) => {
    try {
      const response = await userApi.put('/email', { email: newEmail, password });
      return response.data;
    } catch (error) {
      console.error('Error changing email:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await userApi.put('/password', { 
        currentPassword, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, { 
        token, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  // Add shipping address
  addShippingAddress: async (addressData) => {
    try {
      const response = await userApi.post('/addresses', addressData);
      return response.data;
    } catch (error) {
      console.error('Error adding shipping address:', error);
      throw error;
    }
  },

  // Update shipping address
  updateShippingAddress: async (addressId, addressData) => {
    try {
      const response = await userApi.put(`/addresses/${addressId}`, addressData);
      return response.data;
    } catch (error) {
      console.error(`Error updating shipping address ${addressId}:`, error);
      throw error;
    }
  },

  // Delete shipping address
  deleteShippingAddress: async (addressId) => {
    try {
      const response = await userApi.delete(`/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting shipping address ${addressId}:`, error);
      throw error;
    }
  },

  // Get all shipping addresses
  getShippingAddresses: async () => {
    try {
      const response = await userApi.get('/addresses');
      return response.data;
    } catch (error) {
      console.error('Error fetching shipping addresses:', error);
      throw error;
    }
  },

  // Set default shipping address
  setDefaultShippingAddress: async (addressId) => {
    try {
      const response = await userApi.put(`/addresses/${addressId}/default`);
      return response.data;
    } catch (error) {
      console.error(`Error setting default shipping address ${addressId}:`, error);
      throw error;
    }
  },

  // Get order history
  getOrderHistory: async (params = {}) => {
    try {
      const response = await userApi.get('/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  },

  // Delete account
  deleteAccount: async (password) => {
    try {
      const response = await userApi.delete('/account', {
        data: { password }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    try {
      const response = await userApi.put('/notification-preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },

  // Get notification preferences
  getNotificationPreferences: async () => {
    try {
      const response = await userApi.get('/notification-preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  },

  // Get user activity log
  getActivityLog: async (params = {}) => {
    try {
      const response = await userApi.get('/activity', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity log:', error);
      throw error;
    }
  },

  // Add payment method
  addPaymentMethod: async (paymentData) => {
    try {
      const response = await userApi.post('/payment-methods', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  },

  // Get payment methods
  getPaymentMethods: async () => {
    try {
      const response = await userApi.get('/payment-methods');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },

  // Delete payment method
  deletePaymentMethod: async (paymentMethodId) => {
    try {
      const response = await userApi.delete(`/payment-methods/${paymentMethodId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting payment method ${paymentMethodId}:`, error);
      throw error;
    }
  },

  // Set default payment method
  setDefaultPaymentMethod: async (paymentMethodId) => {
    try {
      const response = await userApi.put(`/payment-methods/${paymentMethodId}/default`);
      return response.data;
    } catch (error) {
      console.error(`Error setting default payment method ${paymentMethodId}:`, error);
      throw error;
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  },

  // Resend verification email
  resendVerificationEmail: async () => {
    try {
      const response = await userApi.post('/resend-verification');
      return response.data;
    } catch (error) {
      console.error('Error resending verification email:', error);
      throw error;
    }
  },

  // Get user notifications
  getNotifications: async (params = {}) => {
    try {
      const response = await userApi.get('/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await userApi.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    try {
      const response = await userApi.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await userApi.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      throw error;
    }
  },

  // Get unread notification count
  getUnreadNotificationCount: async () => {
    try {
      const response = await userApi.get('/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }
  },

  // Enable two-factor authentication
  enableTwoFactorAuth: async (phoneNumber) => {
    try {
      const response = await userApi.post('/two-factor/enable', { phoneNumber });
      return response.data;
    } catch (error) {
      console.error('Error enabling two-factor authentication:', error);
      throw error;
    }
  },

  // Verify two-factor authentication setup
  verifyTwoFactorAuth: async (code) => {
    try {
      const response = await userApi.post('/two-factor/verify', { code });
      return response.data;
    } catch (error) {
      console.error('Error verifying two-factor authentication:', error);
      throw error;
    }
  },

  // Disable two-factor authentication
  disableTwoFactorAuth: async (password) => {
    try {
      const response = await userApi.post('/two-factor/disable', { password });
      return response.data;
    } catch (error) {
      console.error('Error disabling two-factor authentication:', error);
      throw error;
    }
  },

  // Get users by role
  getUsersByRole: async (role) => {
    try {
      const response = await userApi.get(`/api/auth/users?role=${role}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${role} users:`, error);
      throw error;
    }
  }
};

export default userService; 