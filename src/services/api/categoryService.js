import axios from 'axios';
import { API_URL } from '../../config';

// Create an axios instance for category endpoints
const categoryApi = axios.create({
  baseURL: `${API_URL}/api/categories`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor to add auth token
categoryApi.interceptors.request.use(
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

const defaultCategories = [
  {
    name: 'Home and Decor',
    description: 'Home decoration and furnishing items',
    isTrending: true
  },
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    isTrending: true
  },
  {
    name: 'Skin Care',
    description: 'Skin care and beauty products',
    isTrending: true
  },
  {
    name: 'Mobile Devices',
    description: 'Smartphones and mobile accessories',
    isTrending: true
  },
  {
    name: 'Accessories',
    description: 'Fashion and personal accessories',
    isTrending: true
  }
];

const categoryService = {
  // Get all categories
  getAllCategories: async () => {
    try {
      const response = await categoryApi.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get trending categories
  getTrendingCategories: async () => {
    try {
      const response = await categoryApi.get('/trending');
      return response.data;
    } catch (error) {
      console.error('Error fetching trending categories:', error);
      throw error;
    }
  },

  // Get featured categories
  getFeaturedCategories: async (limit = 8) => {
    const response = await categoryApi.get('/featured', {
      params: { limit }
    });
    return response.data;
  },

  // Get top-level categories (categories with no parent)
  getTopLevelCategories: async () => {
    const response = await categoryApi.get('/top');
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (categoryId) => {
    try {
      const response = await categoryApi.get(`/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  },

  // Get category by slug
  getCategoryBySlug: async (slug) => {
    const response = await categoryApi.get(`/slug/${slug}`);
    return response.data;
  },

  // Get subcategories of a category
  getSubcategories: async (categoryId) => {
    const response = await categoryApi.get(`/${categoryId}/subcategories`);
    return response.data;
  },
  
  // Get hierarchical category tree
  getCategoryTree: async () => {
    const response = await categoryApi.get('/tree');
    return response.data;
  },

  // Create category (admin only)
  createCategory: async (categoryData) => {
    try {
      const response = await categoryApi.post('/', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Initialize default categories
  initializeDefaultCategories: async () => {
    try {
      const existingCategories = await categoryApi.get('/');
      
      if (existingCategories.data.categories.length === 0) {
        for (const category of defaultCategories) {
          await categoryApi.post('/', category);
        }
        console.log('Default categories initialized successfully');
      }
      
      return await categoryApi.get('/');
    } catch (error) {
      console.error('Error initializing default categories:', error);
      throw error;
    }
  },

  // Update category (admin only)
  updateCategory: async (categoryId, categoryData) => {
    try {
      const response = await categoryApi.put(`/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete category (admin only)
  deleteCategory: async (categoryId) => {
    try {
      const response = await categoryApi.delete(`/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Upload category image (admin only)
  uploadCategoryImage: async (categoryId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await categoryApi.post(`/${categoryId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    return response.data;
    } catch (error) {
      console.error('Error uploading category image:', error);
      throw error;
    }
  }
};

export default categoryService; 