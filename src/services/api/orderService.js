import axios from 'axios';
import { API_URL } from '../../config';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: `${API_URL}/api/orders`
});

// Add request interceptor to include the token in the headers
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

// Order service methods
const orderService = {
  // Get all orders (admin only)
  getAllOrders: async (params = {}) => {
    const response = await api.get('/', { params });
    return response.data;
  },
  
  // Get user's orders
  getUserOrders: async (params = {}) => {
    const response = await api.get('/my-orders', { params });
    return response.data;
  },
  
  // Get seller's orders
  getSellerOrders: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/orders/seller`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Get order by ID
  getOrderById: async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Create a new order
  createOrder: async (orderData) => {
    const response = await api.post('/', orderData);
    return response.data;
  },
  
  // Update order status
  updateOrderStatus: async (orderId, status, note = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { status, note },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Get order status history
  getOrderStatusHistory: async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/orders/${orderId}/status-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Mark order as delivered
  markOrderDelivered: async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/deliver`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Cancel order
  cancelOrder: async (orderId, reason = 'Cancelled by seller') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/cancel`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Process payment for an order
  processPayment: async (id, paymentData) => {
    const response = await api.post(`/${id}/payment`, paymentData);
    return response.data;
  },
  
  // Get order statistics (admin/seller only)
  getOrderStats: async (params = {}) => {
    const response = await api.get('/stats', { params });
    return response.data;
  },
  
  // Update shipping information
  updateShipping: async (id, shippingData) => {
    const response = await api.patch(`/${id}/shipping`, shippingData);
    return response.data;
  },
  
  // Add tracking information to an order (seller only)
  addTracking: async (id, trackingInfo) => {
    const response = await api.post(`/${id}/tracking`, trackingInfo);
    return response.data;
  },
  
  // Confirm order delivery
  confirmDelivery: async (id) => {
    const response = await api.post(`/${id}/confirm-delivery`);
    return response.data;
  },
  
  // Request a return or refund
  requestReturn: async (id, returnData) => {
    const response = await api.post(`/${id}/return`, returnData);
    return response.data;
  },
  
  // Process a return or refund (admin/seller only)
  processReturn: async (id, returnStatus, notes) => {
    const response = await api.patch(`/${id}/return`, { status: returnStatus, notes });
    return response.data;
  },
  
  // Add a review for an order item
  addReview: async (orderId, productId, reviewData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/orders/${orderId}/products/${productId}/review`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Get reviews for an order
  getOrderReviews: async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/orders/${orderId}/reviews`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default orderService; 