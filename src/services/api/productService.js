import axios from 'axios';
import { API_URL } from '../../config';

// Create an axios instance with the base URL for product API calls
const productApi = axios.create({
  baseURL: `${API_URL}/api/products`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the token in the headers for authenticated routes
productApi.interceptors.request.use(
  (config) => {
    // Always add token for authenticated routes
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

const productService = {
  // Get all products with optional filtering and pagination
  getAllProducts: async (params = {}) => {
    try {
      const response = await productApi.get('/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get products by category
  getProductsByCategory: async (categoryId, params = {}) => {
    try {
      const response = await productApi.get(`/category/${categoryId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
      throw error;
    }
  },

  // Get products by brand
  getProductsByBrand: async (brandId, params = {}) => {
    try {
      const response = await productApi.get(`/brand/${brandId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for brand ${brandId}:`, error);
      throw error;
    }
  },

  // Get a single product by ID
  getProductById: async (productId) => {
    try {
      const response = await productApi.get(`/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  },

  // Get a product by slug
  getProductBySlug: async (slug) => {
    try {
      const response = await productApi.get(`/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product with slug ${slug}:`, error);
      throw error;
    }
  },

  // Get featured products
  getFeaturedProducts: async (limit = 8) => {
    try {
      const response = await productApi.get('/featured', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      // Return empty products array on 404
      if (error.response && error.response.status === 404) {
        console.log('Featured products endpoint not available, returning empty array');
        return { products: [] };
      }
      throw error;
    }
  },

  // Get new arrivals
  getNewArrivals: async (limit = 8) => {
    try {
      const response = await productApi.get('/new-arrivals', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
      // Return empty products array on 404
      if (error.response && error.response.status === 404) {
        console.log('New arrivals endpoint not available, returning empty array');
        return { products: [] };
      }
      throw error;
    }
  },

  // Get best-selling products
  getBestSellers: async (limit = 8) => {
    try {
      const response = await productApi.get('/best-sellers', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      // Return empty products array on 404
      if (error.response && error.response.status === 404) {
        console.log('Best sellers endpoint not available, returning empty array');
        return { products: [] };
      }
      throw error;
    }
  },

  // Search products
  searchProducts: async (query, params = {}) => {
    try {
      const response = await productApi.get('/search', { 
        params: { 
          q: query,
          ...params
        } 
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching products with query "${query}":`, error);
      throw error;
    }
  },

  // Get related products
  getRelatedProducts: async (productId, limit = 4) => {
    try {
      const response = await productApi.get(`/${productId}/related`, { params: { limit } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching related products for ${productId}:`, error);
      // Return an empty array instead of throwing the error
      if (error.response && error.response.status === 404) {
        console.log(`No related products endpoint available for ${productId}, returning empty array`);
        return { products: [] };
      }
      throw error;
    }
  },

  // Get product reviews
  getProductReviews: async (productId, params = {}) => {
    try {
      const response = await productApi.get(`/${productId}/reviews`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      throw error;
    }
  },

  // Add a product review
  addProductReview: async (productId, reviewData) => {
    try {
      const response = await productApi.post(`/${productId}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      console.error(`Error adding review for product ${productId}:`, error);
      throw error;
    }
  },

  // Update a product review
  updateProductReview: async (productId, reviewId, reviewData) => {
    try {
      const response = await productApi.put(`/${productId}/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error(`Error updating review ${reviewId} for product ${productId}:`, error);
      throw error;
    }
  },

  // Delete a product review
  deleteProductReview: async (productId, reviewId) => {
    try {
      const response = await productApi.delete(`/${productId}/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting review ${reviewId} for product ${productId}:`, error);
      throw error;
    }
  },

  // Check if product is in stock
  checkProductStock: async (productId, quantity = 1) => {
    try {
      const response = await productApi.get(`/${productId}/stock`, { params: { quantity } });
      return response.data;
    } catch (error) {
      console.error(`Error checking stock for product ${productId}:`, error);
      throw error;
    }
  },

  // Add product to wishlist
  addToWishlist: async (productId) => {
    try {
      const response = await productApi.post(`/${productId}/wishlist`);
      return response.data;
    } catch (error) {
      console.error(`Error adding product ${productId} to wishlist:`, error);
      throw error;
    }
  },

  // Remove product from wishlist
  removeFromWishlist: async (productId) => {
    try {
      const response = await productApi.delete(`/${productId}/wishlist`);
      return response.data;
    } catch (error) {
      console.error(`Error removing product ${productId} from wishlist:`, error);
      throw error;
    }
  },

  // Check if product is in wishlist
  isInWishlist: async (productId) => {
    try {
      const response = await productApi.get(`/${productId}/wishlist`);
      return response.data.inWishlist;
    } catch (error) {
      console.error(`Error checking if product ${productId} is in wishlist:`, error);
      return false;
    }
  },

  // Get user's wishlist
  getWishlist: async (params = {}) => {
    try {
      const response = await productApi.get('/wishlist', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  },

  // SELLER METHODS

  // Create a product (seller/admin only)
  createProduct: async (productData) => {
    try {
      console.log("Creating product with data:", productData)
      
      // If category is provided as an object with id, extract the id
      if (productData.category && typeof productData.category === 'object' && productData.category._id) {
        productData.category = productData.category._id;
      }
      
      // Handle FormData for file uploads
      let requestData = productData;
      
      // If not already FormData and contains images, convert to FormData
      if (!(productData instanceof FormData) && productData.images) {
        const formData = new FormData();
        
        // Add all other product data
        Object.keys(productData).forEach(key => {
          if (key !== 'images') {
            // Handle nested objects like specifications
            if (typeof productData[key] === 'object' && !(productData[key] instanceof File)) {
              formData.append(key, JSON.stringify(productData[key]));
            } else {
              formData.append(key, productData[key]);
            }
          }
        });
        
        // Add images
        if (Array.isArray(productData.images)) {
          productData.images.forEach(image => {
            formData.append('images', image);
          });
        }
        
        requestData = formData;
      }
      
      // Log the formData contents for debugging
      for (let pair of requestData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      
      const response = await productApi.post('/', requestData, {
        headers: {
          'Content-Type': requestData instanceof FormData ? 'multipart/form-data' : 'application/json',
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update a product (seller/admin only)
  updateProduct: async (productId, productData) => {
    try {
      console.log("Updating product with data:", productData)
      
      // If category is provided as an object with id, extract the id
      if (productData.category && typeof productData.category === 'object' && productData.category._id) {
        productData.category = productData.category._id;
      }
      
      // Handle FormData for file uploads
      let requestData = productData;
      
      // If not already FormData and contains images, convert to FormData
      if (!(productData instanceof FormData) && productData.images) {
        const formData = new FormData();
        
        // Add all other product data
        Object.keys(productData).forEach(key => {
          if (key !== 'images') {
            // Handle nested objects like specifications
            if (typeof productData[key] === 'object' && !(productData[key] instanceof File) && key !== 'colors') {
              formData.append(key, JSON.stringify(productData[key]));
            } else if (key === 'colors') {
              formData.append('colors', JSON.stringify(productData.colors));
            } else {
              formData.append(key, productData[key]);
            }
          }
        });
        
        // Add images - only append file objects, not string URLs
        if (Array.isArray(productData.images)) {
          productData.images.forEach(image => {
            if (image instanceof File) {
              formData.append('images', image);
            } else if (typeof image === 'string') {
              // For existing image URLs, add them separately
              formData.append('existingImages', image);
            }
          });
        }
        
        requestData = formData;
      }
      
      // Log the formData contents for debugging
      if (requestData instanceof FormData) {
        console.log("Form data entries:");
        for (let pair of requestData.entries()) {
          console.log(`${pair[0]}: ${typeof pair[1] === 'object' ? 'File object' : pair[1]}`);
        }
      }
      
      // Use the correct endpoint format - /:id instead of /seller/:id
      const response = await productApi.put(`/${productId}`, requestData, {
        headers: {
          'Content-Type': requestData instanceof FormData ? 'multipart/form-data' : 'application/json',
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${productId}:`, error);
      throw error;
    }
  },

  // Delete a product (seller/admin only)
  deleteProduct: async (productId) => {
    try {
      const response = await productApi.delete(`/seller/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error);
      throw error;
    }
  },

  // Get seller's products
  getSellerProducts: async (params = {}) => {
    try {
      console.log("Getting seller products with token:", localStorage.getItem('token'))
      
      // Use the seller/:sellerId route instead with the current user's ID
      // Get user ID from token or localStorage
      const userData = localStorage.getItem('userData');
      let userId = null;
      
      if (userData) {
        try {
          userId = JSON.parse(userData)._id;
        } catch (e) {
          console.log("Could not parse user data from localStorage");
        }
      }
      
      // If we have a user ID, use it. Otherwise fall back to /seller/me
      const endpoint = userId ? `/seller/${userId}` : '/seller/me';
      console.log("Using endpoint:", endpoint);
      
      const response = await productApi.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching seller products:', error);
      console.error('Error details:', error.response?.data || 'No detailed error information');
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.error('Authentication error - token may be invalid');
      }
      
      // Return empty array as fallback instead of throwing
      return { products: [] };
    }
  },

  // Update product stock (seller/admin only)
  updateProductStock: async (productId, stockData) => {
    try {
      const response = await productApi.put(`/seller/${productId}/stock`, stockData);
      return response.data;
    } catch (error) {
      console.error(`Error updating stock for product ${productId}:`, error);
      throw error;
    }
  },

  // Update product status - active/inactive (seller/admin only)
  updateProductStatus: async (productId, status) => {
    try {
      const response = await productApi.put(`/seller/${productId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating status for product ${productId}:`, error);
      throw error;
    }
  },

  // Get product statistics (seller/admin only)
  getProductStats: async (productId) => {
    try {
      const response = await productApi.get(`/seller/${productId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching stats for product ${productId}:`, error);
      throw error;
    }
  },

  // ADMIN METHODS

  // Get all products (admin only)
  getAllProductsAdmin: async (params = {}) => {
    try {
      const response = await productApi.get('/admin', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all products (admin):', error);
      throw error;
    }
  },

  // Approve a product (admin only)
  approveProduct: async (productId) => {
    try {
      const response = await productApi.put(`/admin/${productId}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Error approving product ${productId}:`, error);
      throw error;
    }
  },

  // Reject a product (admin only)
  rejectProduct: async (productId, reason) => {
    try {
      const response = await productApi.put(`/admin/${productId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting product ${productId}:`, error);
      throw error;
    }
  },

  // Feature a product (admin only)
  featureProduct: async (productId, featured = true) => {
    try {
      const response = await productApi.put(`/admin/${productId}/feature`, { featured });
      return response.data;
    } catch (error) {
      console.error(`Error ${featured ? 'featuring' : 'unfeaturing'} product ${productId}:`, error);
      throw error;
    }
  },
  
  // Get product approval queue (admin only)
  getProductApprovalQueue: async (params = {}) => {
    try {
      const response = await productApi.get('/admin/approval-queue', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching product approval queue:', error);
      throw error;
    }
  },

  // Get product stats by category (admin only)
  getProductStatsByCategory: async () => {
    try {
      const response = await productApi.get('/admin/stats/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching product stats by category:', error);
      throw error;
    }
  },

  // Get product stats by seller (admin only)
  getProductStatsBySeller: async () => {
    try {
      const response = await productApi.get('/admin/stats/sellers');
      return response.data;
    } catch (error) {
      console.error('Error fetching product stats by seller:', error);
      throw error;
    }
  }
};

export default productService; 