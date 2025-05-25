import axios from 'axios';
import { API_URL } from '../../config';

const brandVerificationService = {
  // Submit brand verification request
  submitVerification: async (formData) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      const response = await axios.post(`${API_URL}/api/brand-verification`, formData, config);
      return response.data;
    } catch (error) {
      console.error('Error submitting brand verification:', error);
      throw error;
    }
  },

  // Get seller's verification requests
  getSellerRequests: async () => {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      const response = await axios.get(`${API_URL}/api/brand-verification/seller`, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching seller verification requests:', error);
      throw error;
    }
  },

  // Get verification request status
  getRequestStatus: async (requestId) => {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      const response = await axios.get(`${API_URL}/api/brand-verification/${requestId}`, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching verification request status:', error);
      throw error;
    }
  }
};

export default brandVerificationService; 