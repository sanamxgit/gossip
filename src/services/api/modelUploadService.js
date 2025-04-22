import axios from 'axios';
import { API_URL } from '../../config';

// Create an axios instance with the base URL for model uploads
const modelUploadApi = axios.create({
  baseURL: `${API_URL}/api/models`
});

// Add request interceptor to include auth token
modelUploadApi.interceptors.request.use(
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

const modelUploadService = {
  // Upload 3D model to GitHub repository
  uploadModelToGitHub: async (modelFile, modelType = 'usdz') => {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('model', modelFile);
      formData.append('type', modelType);
      
      // Send upload request to server
      const response = await modelUploadApi.post('/upload-to-github', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading model to GitHub:', error);
      throw error;
    }
  },
  
  // Get list of models from GitHub repository
  getModelsFromGitHub: async () => {
    try {
      const response = await modelUploadApi.get('/github-models');
      return response.data;
    } catch (error) {
      console.error('Error fetching models from GitHub:', error);
      throw error;
    }
  },
  
  // Preview 3D model
  previewModel: async (modelUrl, modelType) => {
    try {
      // This could validate if the model is accessible
      const response = await axios.head(modelUrl);
      return {
        url: modelUrl,
        type: modelType,
        isValid: response.status === 200
      };
    } catch (error) {
      console.error('Error previewing model:', error);
      return {
        url: modelUrl,
        type: modelType,
        isValid: false,
        error: error.message
      };
    }
  }
};

export default modelUploadService; 