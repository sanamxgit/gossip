import axios from 'axios';
import { API_URL } from '../../config';

// Create an axios instance with the base URL for home sections API calls
const homeSectionApi = axios.create({
  baseURL: `${API_URL}/api/home-sections`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the token in the headers for authenticated routes
homeSectionApi.interceptors.request.use(
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

const homeSectionService = {
  // Get all home sections
  getHomeSections: async () => {
    try {
      const response = await homeSectionApi.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching home sections:', error);
      throw error;
    }
  },

  // Get a home section by ID
  getHomeSectionById: async (sectionId) => {
    try {
      const response = await homeSectionApi.get(`/${sectionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching home section ${sectionId}:`, error);
      throw error;
    }
  },

  // Create a home section (admin only)
  createHomeSection: async (sectionData) => {
    try {
      const response = await homeSectionApi.post('/', sectionData);
      return response.data;
    } catch (error) {
      console.error('Error creating home section:', error);
      throw error;
    }
  },

  // Update a home section (admin only)
  updateHomeSection: async (sectionId, sectionData) => {
    try {
      const response = await homeSectionApi.put(`/${sectionId}`, sectionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating home section ${sectionId}:`, error);
      throw error;
    }
  },

  // Delete a home section (admin only)
  deleteHomeSection: async (sectionId) => {
    try {
      const response = await homeSectionApi.delete(`/${sectionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting home section ${sectionId}:`, error);
      throw error;
    }
  },

  // Reorder home sections (admin only)
  reorderHomeSections: async (sectionOrder) => {
    try {
      const response = await homeSectionApi.put('/reorder', { sectionOrder });
      return response.data;
    } catch (error) {
      console.error('Error reordering home sections:', error);
      throw error;
    }
  }
};

export default homeSectionService; 