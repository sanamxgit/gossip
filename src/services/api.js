import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = 
      error.response?.data?.message || 
      error.message || 
      'Something went wrong';
    return Promise.reject({ message, status: error.response?.status });
  }
);

// Auth service
export const authService = {
  // Register a new user
  register: async (userData) => {
    return API.post('/users/register', userData);
  },
  
  // Login user
  login: async (credentials) => {
    const response = await API.post('/users/login', credentials);
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
  },
  
  // Get current user
  getCurrentUser: async () => {
    return API.get('/users/me');
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    return API.put('/users/profile', userData);
  },
  
  // Apply to become a seller
  applyForSeller: async (sellerData) => {
    return API.post('/users/apply-seller', sellerData);
  },
  
  // Check if token is valid
  validateToken: async () => {
    try {
      await API.get('/users/validate-token');
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      return false;
    }
  }
};

// Product service
export const productService = {
  // Get all products
  getProducts: async (params = {}) => {
    return API.get('/products', { params });
  },
  
  // Get featured products
  getFeaturedProducts: async () => {
    return API.get('/products/featured');
  },
  
  // Get product by ID
  getProductById: async (id) => {
    return API.get(`/products/${id}`);
  },
  
  // Get products by category
  getProductsByCategory: async (categoryId) => {
    return API.get(`/products/category/${categoryId}`);
  },
  
  // Get products by brand
  getProductsByBrand: async (brandId) => {
    return API.get(`/products/brand/${brandId}`);
  },
  
  // Search products
  searchProducts: async (query) => {
    return API.get('/products/search', { params: { query } });
  },
  
  // Create a new product (for sellers)
  createProduct: async (productData) => {
    const formData = new FormData();
    
    // Convert product data to form data for file uploads
    Object.keys(productData).forEach(key => {
      if (key === 'images' && productData[key]) {
        for (let i = 0; i < productData[key].length; i++) {
          formData.append('images', productData[key][i]);
        }
      } else {
        formData.append(key, productData[key]);
      }
    });
    
    return API.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Update a product (for sellers)
  updateProduct: async (id, productData) => {
    const formData = new FormData();
    
    // Convert product data to form data for file uploads
    Object.keys(productData).forEach(key => {
      if (key === 'images' && productData[key]) {
        for (let i = 0; i < productData[key].length; i++) {
          formData.append('images', productData[key][i]);
        }
      } else {
        formData.append(key, productData[key]);
      }
    });
    
    return API.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete a product (for sellers)
  deleteProduct: async (id) => {
    return API.delete(`/products/${id}`);
  },
  
  // Create a product review
  createProductReview: async (productId, reviewData) => {
    return API.post(`/products/${productId}/reviews`, reviewData);
  }
};

// Category service
export const categoryService = {
  // Get all categories
  getCategories: async () => {
    return API.get('/categories');
  },
  
  // Get category by ID
  getCategoryById: async (id) => {
    return API.get(`/categories/${id}`);
  },
  
  // Create a new category (admin only)
  createCategory: async (categoryData) => {
    const formData = new FormData();
    
    Object.keys(categoryData).forEach(key => {
      if (key === 'image' && categoryData[key]) {
        formData.append('image', categoryData[key]);
      } else {
        formData.append(key, categoryData[key]);
      }
    });
    
    return API.post('/categories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Update a category (admin only)
  updateCategory: async (id, categoryData) => {
    const formData = new FormData();
    
    Object.keys(categoryData).forEach(key => {
      if (key === 'image' && categoryData[key]) {
        formData.append('image', categoryData[key]);
      } else {
        formData.append(key, categoryData[key]);
      }
    });
    
    return API.put(`/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete a category (admin only)
  deleteCategory: async (id) => {
    return API.delete(`/categories/${id}`);
  }
};

// Brand service
export const brandService = {
  // Get all brands
  getBrands: async () => {
    return API.get('/brands');
  },
  
  // Get brand by ID
  getBrandById: async (id) => {
    return API.get(`/brands/${id}`);
  },
  
  // Create a new brand (admin only)
  createBrand: async (brandData) => {
    const formData = new FormData();
    
    Object.keys(brandData).forEach(key => {
      if (key === 'logo' && brandData[key]) {
        formData.append('logo', brandData[key]);
      } else {
        formData.append(key, brandData[key]);
      }
    });
    
    return API.post('/brands', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Update a brand (admin only)
  updateBrand: async (id, brandData) => {
    const formData = new FormData();
    
    Object.keys(brandData).forEach(key => {
      if (key === 'logo' && brandData[key]) {
        formData.append('logo', brandData[key]);
      } else {
        formData.append(key, brandData[key]);
      }
    });
    
    return API.put(`/brands/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete a brand (admin only)
  deleteBrand: async (id) => {
    return API.delete(`/brands/${id}`);
  }
};

// Order service
export const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    return API.post('/orders', orderData);
  },
  
  // Get user orders
  getUserOrders: async () => {
    return API.get('/orders/my-orders');
  },
  
  // Get order by ID
  getOrderById: async (id) => {
    return API.get(`/orders/${id}`);
  },
  
  // Update order to paid
  updateOrderToPaid: async (orderId, paymentResult) => {
    return API.put(`/orders/${orderId}/pay`, paymentResult);
  },
  
  // Update order to delivered (admin/seller only)
  updateOrderToDelivered: async (orderId) => {
    return API.put(`/orders/${orderId}/deliver`);
  },
  
  // Get all orders (admin/seller only)
  getOrders: async (params = {}) => {
    return API.get('/orders', { params });
  }
};

export default API; 