import axios from 'axios';
import { API_URL } from '../../config';

// Create an axios instance with the base URL for cart API calls
const cartApi = axios.create({
  baseURL: `${API_URL}/api/cart`
});

// Add a request interceptor to include the token in the headers for authenticated routes
cartApi.interceptors.request.use(
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

// Helper function to get cart from local storage for anonymous users
const getLocalCart = () => {
  const localCart = localStorage.getItem('cart');
  return localCart ? JSON.parse(localCart) : { items: [], total: 0 };
};

// Helper function to save cart to local storage for anonymous users
const saveLocalCart = (cart) => {
  localStorage.setItem('cart', JSON.stringify(cart));
};

const cartService = {
  // Get current user's cart
  getCart: async () => {
    try {
      // If no token, return local cart
      if (!localStorage.getItem('token')) {
        return getLocalCart();
      }
      
      const response = await cartApi.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1, options = {}) => {
    try {
      // If no token, handle locally
      if (!localStorage.getItem('token')) {
        const localCart = getLocalCart();
        
        // Check if product already in cart
        const existingItem = localCart.items.find(item => 
          item.product === productId && 
          JSON.stringify(item.options || {}) === JSON.stringify(options || {})
        );
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          // For local cart, we can only store IDs - product details will need to be fetched separately
          localCart.items.push({
            product: productId,
            quantity,
            options,
            addedAt: new Date().toISOString()
          });
        }
        
        // Note: In a real app, we would recalculate total here
        // But we need product price information which would require additional API calls
        
        saveLocalCart(localCart);
        return localCart;
      }
      
      // If token exists, use the API
      const response = await cartApi.post('/add', { 
        productId, 
        quantity,
        options 
      });
      
      return response.data;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  },

  // Update item quantity in cart
  updateCartItem: async (itemId, quantity) => {
    try {
      // If no token, handle locally
      if (!localStorage.getItem('token')) {
        const localCart = getLocalCart();
        
        // For local cart, the itemId is the index of the item
        const itemIndex = parseInt(itemId, 10);
        
        if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= localCart.items.length) {
          throw new Error('Invalid item ID for local cart');
        }
        
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          localCart.items.splice(itemIndex, 1);
        } else {
          localCart.items[itemIndex].quantity = quantity;
        }
        
        saveLocalCart(localCart);
        return localCart;
      }
      
      // If token exists, use the API
      const response = await cartApi.patch(`/items/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    try {
      // If no token, handle locally
      if (!localStorage.getItem('token')) {
        const localCart = getLocalCart();
        
        // For local cart, the itemId is the index of the item
        const itemIndex = parseInt(itemId, 10);
        
        if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= localCart.items.length) {
          throw new Error('Invalid item ID for local cart');
        }
        
        localCart.items.splice(itemIndex, 1);
        saveLocalCart(localCart);
        return localCart;
      }
      
      // If token exists, use the API
      const response = await cartApi.delete(`/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  },

  // Clear cart
  clearCart: async () => {
    try {
      // If no token, handle locally
      if (!localStorage.getItem('token')) {
        const emptyCart = { items: [], total: 0 };
        saveLocalCart(emptyCart);
        return emptyCart;
      }
      
      // If token exists, use the API
      const response = await cartApi.delete('/');
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  // Apply a coupon or promo code to the cart
  applyCoupon: async (couponCode) => {
    try {
      // This operation requires authentication
      if (!localStorage.getItem('token')) {
        throw new Error('Authentication required to apply coupons');
      }
      
      const response = await cartApi.post('/coupon', { code: couponCode });
      return response.data;
    } catch (error) {
      console.error('Error applying coupon:', error);
      throw error;
    }
  },

  // Remove a coupon from the cart
  removeCoupon: async () => {
    try {
      // This operation requires authentication
      if (!localStorage.getItem('token')) {
        throw new Error('Authentication required to remove coupons');
      }
      
      const response = await cartApi.delete('/coupon');
      return response.data;
    } catch (error) {
      console.error('Error removing coupon:', error);
      throw error;
    }
  },

  // Save cart for later (creates a saved cart or wishlist)
  saveForLater: async (itemId) => {
    try {
      // This operation requires authentication
      if (!localStorage.getItem('token')) {
        throw new Error('Authentication required to save items for later');
      }
      
      const response = await cartApi.post(`/save-for-later/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error saving item for later:', error);
      throw error;
    }
  },

  // Move an item from saved items back to the cart
  moveToCart: async (savedItemId) => {
    try {
      // This operation requires authentication
      if (!localStorage.getItem('token')) {
        throw new Error('Authentication required to move saved items to cart');
      }
      
      const response = await cartApi.post(`/move-to-cart/${savedItemId}`);
      return response.data;
    } catch (error) {
      console.error('Error moving saved item to cart:', error);
      throw error;
    }
  },

  // Get saved items (wishlist)
  getSavedItems: async () => {
    try {
      // This operation requires authentication
      if (!localStorage.getItem('token')) {
        throw new Error('Authentication required to get saved items');
      }
      
      const response = await cartApi.get('/saved');
      return response.data;
    } catch (error) {
      console.error('Error fetching saved items:', error);
      throw error;
    }
  },

  // Sync local cart with server after login
  syncCart: async () => {
    try {
      // Only needed if there was a local cart before login
      if (!localStorage.getItem('token') || !localStorage.getItem('cart')) {
        return;
      }
      
      const localCart = getLocalCart();
      
      // Skip if the local cart is empty
      if (localCart.items.length === 0) {
        localStorage.removeItem('cart');
        return;
      }
      
      // Sync all items to the server
      const response = await cartApi.post('/sync', { items: localCart.items });
      
      // Remove the local cart after successful sync
      localStorage.removeItem('cart');
      
      return response.data;
    } catch (error) {
      console.error('Error syncing cart:', error);
      throw error;
    }
  },

  // Calculate shipping cost
  calculateShipping: async (address) => {
    try {
      // This operation requires authentication
      if (!localStorage.getItem('token')) {
        throw new Error('Authentication required to calculate shipping costs');
      }
      
      const response = await cartApi.post('/shipping', { address });
      return response.data;
    } catch (error) {
      console.error('Error calculating shipping:', error);
      throw error;
    }
  },

  // Get cart summary (for checkout page)
  getCartSummary: async () => {
    try {
      // This operation requires authentication
      if (!localStorage.getItem('token')) {
        throw new Error('Authentication required to get cart summary');
      }
      
      const response = await cartApi.get('/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching cart summary:', error);
      throw error;
    }
  }
};

export default cartService; 