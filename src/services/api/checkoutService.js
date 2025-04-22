import axios from 'axios';
import { API_URL } from '../../config';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: `${API_URL}/api/checkout`
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

const checkoutService = {
  // Initialize checkout process
  initializeCheckout: async () => {
    const response = await api.post('/initialize');
    return response.data;
  },
  
  // Save shipping address
  saveShippingAddress: async (addressData) => {
    const response = await api.post('/shipping-address', addressData);
    return response.data;
  },
  
  // Save billing address
  saveBillingAddress: async (addressData, sameAsShipping = false) => {
    const response = await api.post('/billing-address', {
      ...addressData,
      sameAsShipping
    });
    return response.data;
  },
  
  // Get available shipping methods
  getShippingMethods: async (addressId) => {
    const response = await api.get(`/shipping-methods?addressId=${addressId}`);
    return response.data;
  },
  
  // Select shipping method
  selectShippingMethod: async (shippingMethodId) => {
    const response = await api.post('/shipping-method', { shippingMethodId });
    return response.data;
  },
  
  // Get available payment methods
  getPaymentMethods: async () => {
    const response = await api.get('/payment-methods');
    return response.data;
  },
  
  // Process payment with credit card
  processPaymentWithCard: async (paymentData) => {
    const response = await api.post('/payment/card', paymentData);
    return response.data;
  },
  
  // Process payment with PayPal
  processPaymentWithPayPal: async () => {
    const response = await api.post('/payment/paypal');
    return response.data;
  },
  
  // Complete PayPal payment after user authorization
  completePayPalPayment: async (paymentId, payerId) => {
    const response = await api.post('/payment/paypal/complete', { paymentId, payerId });
    return response.data;
  },
  
  // Apply coupon code
  applyCoupon: async (couponCode) => {
    const response = await api.post('/coupon', { code: couponCode });
    return response.data;
  },
  
  // Remove coupon
  removeCoupon: async () => {
    const response = await api.delete('/coupon');
    return response.data;
  },
  
  // Get order summary
  getOrderSummary: async () => {
    const response = await api.get('/summary');
    return response.data;
  },
  
  // Place order (final step)
  placeOrder: async (additionalData = {}) => {
    const response = await api.post('/place-order', additionalData);
    return response.data;
  },
  
  // Validate checkout data before placing order
  validateCheckout: async () => {
    const response = await api.get('/validate');
    return response.data;
  },
  
  // Save customer notes
  saveNotes: async (notes) => {
    const response = await api.post('/notes', { notes });
    return response.data;
  },
  
  // Get available saved addresses for the user
  getSavedAddresses: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },
  
  // Use saved address for shipping or billing
  useSavedAddress: async (addressId, addressType = 'shipping') => {
    const response = await api.post('/use-saved-address', { 
      addressId, 
      addressType 
    });
    return response.data;
  },
  
  // Save address for future use
  saveAddressForFuture: async (addressData, addressType = 'shipping', setAsDefault = false) => {
    const response = await api.post('/save-address', {
      ...addressData,
      addressType,
      setAsDefault
    });
    return response.data;
  },
  
  // Validate a coupon code without applying it
  validateCoupon: async (couponCode) => {
    const response = await api.get(`/validate-coupon?code=${couponCode}`);
    return response.data;
  },
  
  // Check if all cart items are in stock
  checkStock: async () => {
    const response = await api.get('/check-stock');
    return response.data;
  }
};

export default checkoutService; 