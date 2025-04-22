import axios from 'axios';
import { API_URL } from '../../config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${API_URL}/api/categories`,
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

const categoryService = {
  // Get all categories
  getAllCategories: async (sort = '') => {
    const response = await api.get('/', {
      params: { sort }
    });
    return response.data;
  },

  // Get featured categories
  getFeaturedCategories: async (limit = 8) => {
    const response = await api.get('/featured', {
      params: { limit }
    });
    return response.data;
  },

  // Get top-level categories (categories with no parent)
  getTopLevelCategories: async () => {
    const response = await api.get('/top-level');
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (categoryId) => {
    const response = await api.get(`/${categoryId}`);
    return response.data;
  },

  // Get category by slug
  getCategoryBySlug: async (slug) => {
    const response = await api.get(`/slug/${slug}`);
    return response.data;
  },

  // Get subcategories of a category
  getSubcategories: async (categoryId) => {
    const response = await api.get(`/${categoryId}/subcategories`);
    return response.data;
  },
  
  // Get hierarchical category tree
  getCategoryTree: async () => {
    const response = await api.get('/tree');
    return response.data;
  },

  // Create new category (admin only)
  createCategory: async (categoryData) => {
    const formData = new FormData();
    
    // Append text fields
    Object.keys(categoryData).forEach(key => {
      if (key !== 'image') {
        formData.append(key, 
          typeof categoryData[key] === 'object' 
          ? JSON.stringify(categoryData[key]) 
          : categoryData[key]);
      }
    });
    
    // Append image if provided
    if (categoryData.image) {
      formData.append('image', categoryData.image);
    }
    
    const response = await api.post('/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update category (admin only)
  updateCategory: async (categoryId, categoryData) => {
    const formData = new FormData();
    
    // Append text fields
    Object.keys(categoryData).forEach(key => {
      if (key !== 'image' && key !== 'newImage') {
        formData.append(key, 
          typeof categoryData[key] === 'object' 
          ? JSON.stringify(categoryData[key]) 
          : categoryData[key]);
      }
    });
    
    // Append new image if provided
    if (categoryData.newImage) {
      formData.append('image', categoryData.newImage);
    }
    
    const response = await api.put(`/${categoryId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Delete category (admin only)
  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/${categoryId}`);
    return response.data;
  }
};

export default categoryService; 