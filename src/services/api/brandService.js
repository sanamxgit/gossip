import axios from 'axios';
import { API_URL } from '../../config';

// Create an axios instance with the base URL for brand API calls
const brandApi = axios.create({
  baseURL: `${API_URL}/api/brands`
});

// Add a request interceptor to include the token in the headers for authenticated routes
brandApi.interceptors.request.use(
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

const brandService = {
  // Get all brands with optional filtering and pagination
  getAllBrands: async (params = {}) => {
    try {
      const response = await brandApi.get('', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  },

  // Get a single brand by ID
  getBrandById: async (brandId) => {
    try {
      const response = await brandApi.get(`/${brandId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching brand ${brandId}:`, error);
      throw error;
    }
  },

  // Get a brand by slug
  getBrandBySlug: async (slug) => {
    try {
      const response = await brandApi.get(`/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching brand with slug ${slug}:`, error);
      throw error;
    }
  },

  // Get featured brands
  getFeaturedBrands: async (limit = 8) => {
    try {
      const response = await brandApi.get('/featured', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching featured brands:', error);
      throw error;
    }
  },

  // Get products for a specific brand
  getBrandProducts: async (brandId, params = {}) => {
    try {
      const response = await brandApi.get(`/${brandId}/products`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for brand ${brandId}:`, error);
      throw error;
    }
  },

  // Search brands
  searchBrands: async (query, params = {}) => {
    try {
      const response = await brandApi.get('/search', { 
        params: { 
          q: query,
          ...params
        } 
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching brands with query "${query}":`, error);
      throw error;
    }
  },

  // SELLER METHODS
  
  // Submit a brand for approval (seller only)
  submitBrand: async (brandData) => {
    try {
      // Use FormData to handle logo upload
      const formData = new FormData();
      
      // Process brand data and logo
      Object.keys(brandData).forEach(key => {
        if (key === 'logo' && brandData.logo instanceof File) {
          formData.append('logo', brandData.logo);
        } else {
          formData.append(key, brandData[key]);
        }
      });
      
      const response = await brandApi.post('/seller/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error submitting brand:', error);
      throw error;
    }
  },

  // Get brands submitted by the seller
  getSellerBrands: async () => {
    try {
      const response = await brandApi.get('/seller');
      return response.data;
    } catch (error) {
      console.error('Error fetching seller brands:', error);
      throw error;
    }
  },

  // Update a brand submitted by the seller
  updateSellerBrand: async (brandId, brandData) => {
    try {
      // Use FormData to handle logo upload
      const formData = new FormData();
      
      // Process brand data and logo
      Object.keys(brandData).forEach(key => {
        if (key === 'logo' && brandData.logo instanceof File) {
          formData.append('logo', brandData.logo);
        } else {
          formData.append(key, brandData[key]);
        }
      });
      
      const response = await brandApi.put(`/seller/${brandId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating brand ${brandId}:`, error);
      throw error;
    }
  },

  // ADMIN METHODS

  // Create a new brand (admin only)
  createBrand: async (brandData) => {
    try {
      // Use FormData to handle logo upload
      const formData = new FormData();
      
      // Process brand data and logo
      Object.keys(brandData).forEach(key => {
        if (key === 'logo' && brandData.logo instanceof File) {
          formData.append('logo', brandData.logo);
        } else {
          formData.append(key, brandData[key]);
        }
      });
      
      const response = await brandApi.post('/admin', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  },

  // Update a brand (admin only)
  updateBrand: async (brandId, brandData) => {
    try {
      // Use FormData to handle logo upload
      const formData = new FormData();
      
      // Process brand data and logo
      Object.keys(brandData).forEach(key => {
        if (key === 'logo' && brandData.logo instanceof File) {
          formData.append('logo', brandData.logo);
        } else {
          formData.append(key, brandData[key]);
        }
      });
      
      const response = await brandApi.put(`/admin/${brandId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating brand ${brandId}:`, error);
      throw error;
    }
  },

  // Delete a brand (admin only)
  deleteBrand: async (brandId) => {
    try {
      const response = await brandApi.delete(`/admin/${brandId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting brand ${brandId}:`, error);
      throw error;
    }
  },

  // Approve a brand (admin only)
  approveBrand: async (brandId) => {
    try {
      const response = await brandApi.put(`/admin/${brandId}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Error approving brand ${brandId}:`, error);
      throw error;
    }
  },

  // Reject a brand (admin only)
  rejectBrand: async (brandId, reason) => {
    try {
      const response = await brandApi.put(`/admin/${brandId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting brand ${brandId}:`, error);
      throw error;
    }
  },

  // Feature a brand (admin only)
  featureBrand: async (brandId, featured = true) => {
    try {
      const response = await brandApi.put(`/admin/${brandId}/feature`, { featured });
      return response.data;
    } catch (error) {
      console.error(`Error ${featured ? 'featuring' : 'unfeaturing'} brand ${brandId}:`, error);
      throw error;
    }
  },

  // Get brand approval queue (admin only)
  getBrandApprovalQueue: async (params = {}) => {
    try {
      const response = await brandApi.get('/admin/approval-queue', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching brand approval queue:', error);
      throw error;
    }
  },

  // Get brand stats (admin only)
  getBrandStats: async () => {
    try {
      const response = await brandApi.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching brand stats:', error);
      throw error;
    }
  }
};

export default brandService; 