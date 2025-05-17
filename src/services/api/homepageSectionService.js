import axios from 'axios';
import { API_URL } from '../../config';

// Create an axios instance with the base URL for homepage sections API calls
const homepageSectionApi = axios.create({
  baseURL: `${API_URL}/api/homepage/sections`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the token in the headers for authenticated routes
homepageSectionApi.interceptors.request.use(
  (config) => {
    // Add token for authenticated routes
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

// Add a helper to get MongoDB IDs
const getMongoIdByOrder = (order) => {
  try {
    const storedIds = localStorage.getItem('sectionMongoIds');
    if (storedIds) {
      const idsMap = JSON.parse(storedIds);
      return idsMap[order];
    }
  } catch (error) {
    console.error('Error retrieving MongoDB ID:', error);
  }
  return null;
};

const storeMongoIds = (sections) => {
  try {
    if (Array.isArray(sections)) {
      // Create a map of order -> MongoDB ID
      const idsMap = {};
      sections.forEach(section => {
        if (section._id && section.order) {
          idsMap[section.order] = section._id;
        }
      });
      localStorage.setItem('sectionMongoIds', JSON.stringify(idsMap));
      console.log('Stored section MongoDB IDs:', idsMap);
    }
  } catch (error) {
    console.error('Error storing MongoDB IDs:', error);
  }
};

// Service methods
const homepageSectionService = {
  // Get all homepage sections (public)
  getAllSections: async () => {
    try {
      const response = await homepageSectionApi.get('/');
      
      // Store MongoDB IDs for later use
      storeMongoIds(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching homepage sections:', error);
      
      // Fallback to localStorage if API fails
      const savedSections = localStorage.getItem('homePageSections');
      if (savedSections) {
        try {
          return JSON.parse(savedSections);
        } catch (parseError) {
          console.error('Error parsing saved sections:', parseError);
          return [];
        }
      }
      
      return [];
    }
  },
  
  // Get all sections for admin (including inactive)
  getAdminSections: async () => {
    try {
      const response = await homepageSectionApi.get('/admin');
      
      // Store MongoDB IDs for later use
      storeMongoIds(response.data);
      
      // Log the IDs to help with debugging
      console.log('Admin sections with IDs:');
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(section => {
          console.log(`- ID: ${section._id}, Order: ${section.order}, Title: ${section.title}`);
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching admin homepage sections:', error);
      
      // Fallback to localStorage if API fails
      const savedSections = localStorage.getItem('homePageSections');
      if (savedSections) {
        try {
          return JSON.parse(savedSections);
        } catch (parseError) {
          console.error('Error parsing saved sections:', parseError);
          return [];
        }
      }
      
      return [];
    }
  },
  
  // Get a single section by ID (admin only)
  getSectionById: async (sectionId) => {
    try {
      const response = await homepageSectionApi.get(`/admin/${sectionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching section ${sectionId}:`, error);
      throw error;
    }
  },
  
  // Create a new section (admin only)
  createSection: async (sectionData) => {
    try {
      // Create a copy of the data to avoid modifying the original
      const processedData = { ...sectionData };
      
      // Process content based on section type for consistency with updateSection
      if (processedData.type === 'icon-categories') {
        try {
          // Process icon-categories content
          let contentObj = typeof processedData.content === 'string'
            ? JSON.parse(processedData.content)
            : processedData.content;
            
          // Normalize structure
          let categories = Array.isArray(contentObj) ? contentObj : 
                           (contentObj.categories && Array.isArray(contentObj.categories)) ? 
                            contentObj.categories : [];
          
          // Format categories properly
          const formattedContent = { 
            categories: categories.map(cat => ({
              name: cat.name || '',
              imageUrl: (cat.imageUrl?.startsWith('blob:') ? '/uploads/placeholder.svg' : cat.imageUrl) || '',
              link: cat.link || ''
            }))
          };
          
          processedData.content = formattedContent;
        } catch (error) {
          console.error('Error processing icon-categories for creation:', error);
        }
      } else if (processedData.content && typeof processedData.content !== 'string' && processedData.type !== 'banner') {
        // For non-banner types, stringify if not already a string
        processedData.content = JSON.stringify(processedData.content);
      }
      
      console.log('Creating new section with data:', processedData);
      const response = await homepageSectionApi.post('/admin', processedData);
      return response.data;
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    }
  },
  
  // Update a section (admin only)
  updateSection: async (sectionId, sectionData) => {
    try {
      // Create a copy of the data to avoid modifying the original
      const processedData = { ...sectionData };
      
      // If sectionId looks like an order number (simple integer), try to get the MongoDB ID
      if (/^\d+$/.test(sectionId.toString())) {
        const order = parseInt(sectionId);
        const mongoId = getMongoIdByOrder(order);
        
        if (mongoId) {
          console.log(`Converting order ${order} to MongoDB ID ${mongoId}`);
          sectionId = mongoId;
        } else {
          console.log(`No MongoDB ID found for order ${order}`);
        }
      }
      
      // Ensure sectionId is a string
      const idToUse = sectionId.toString();
      
      // Handle content processing based on section type
      if (processedData.type === 'icon-categories') {
        try {
          // Parse the content if it's a string
          let contentObj;
          if (typeof processedData.content === 'string') {
            try {
              contentObj = JSON.parse(processedData.content);
            } catch (parseError) {
              console.error('Failed to parse icon-categories content string:', parseError);
              throw new Error(`Invalid JSON format: ${parseError.message}`);
            }
          } else {
            contentObj = processedData.content;
          }
          
          // Normalize the structure to ensure it has categories array
          let categories = [];
          if (Array.isArray(contentObj)) {
            categories = contentObj;
          } else if (contentObj.categories && Array.isArray(contentObj.categories)) {
            categories = contentObj.categories;
          } else {
            console.error('Categories missing or not an array:', contentObj);
            throw new Error('Categories must be an array');
          }
          
          // Validate each category and handle blob URLs
          const validatedCategories = categories.map(cat => {
            if (!cat || typeof cat !== 'object') {
              throw new Error('Each category must be an object');
            }
            
            // Handle blob URLs - replace with a placeholder path that the server can handle
            const imageUrl = cat.imageUrl || '';
            const processedImageUrl = imageUrl.startsWith('blob:') 
              ? '/uploads/placeholder.svg'  // Use placeholder path instead of blob URL
              : imageUrl;
            
            // Ensure required properties
            return {
              name: cat.name || '',
              imageUrl: processedImageUrl,
              link: cat.link || ''
            };
          });
          
          // Set the properly formatted content
          const formattedContent = { categories: validatedCategories };
          processedData.content = JSON.stringify(formattedContent);
          
          console.log('Formatted icon-categories content:', processedData.content);
        } catch (error) {
          console.error('Error processing icon-categories data:', error);
          throw new Error(`Error processing icon-categories: ${error.message}`);
        }
      } else if (processedData.content && typeof processedData.content !== 'string') {
        // For non-icon-categories, just stringify if not already a string
        processedData.content = JSON.stringify(processedData.content);
      }
      
      console.log('Sending data to server:', {
        id: idToUse,
        ...processedData
      });
      
      const response = await homepageSectionApi.put(`/admin/${idToUse}`, processedData);
      return response.data;
    } catch (error) {
      console.error(`Error updating section ${sectionId}:`, error);
      throw error;
    }
  },
  
  // Delete a section (admin only)
  deleteSection: async (sectionId) => {
    try {
      const response = await homepageSectionApi.delete(`/admin/${sectionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting section ${sectionId}:`, error);
      throw error;
    }
  },
  
  // Reorder sections (admin only)
  reorderSections: async (sectionIds) => {
    try {
      const response = await homepageSectionApi.put('/admin/reorder', { sectionIds });
      return response.data;
    } catch (error) {
      console.error('Error reordering sections:', error);
      throw error;
    }
  },
  
  // Upload an image for a section (admin only)
  uploadSectionImage: async (imageFile, sectionType) => {
    try {
      console.log(`Uploading image for section type: ${sectionType}`, imageFile);
      
      // Validate if imageFile is a valid file
      if (!imageFile || !(imageFile instanceof File)) {
        throw new Error('Invalid file provided for upload');
      }
      
      // Validate file type (make sure it's an image)
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validImageTypes.includes(imageFile.type)) {
        throw new Error(`Invalid file type: ${imageFile.type}. Allowed types: ${validImageTypes.join(', ')}`);
      }
      
      // Validate file size (max 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > MAX_FILE_SIZE) {
        throw new Error(`File size (${(imageFile.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (5MB)`);
      }
      
      // Create FormData object
      const formData = new FormData();
      // Use sectionImage as the field name to match what server expects
      formData.append('sectionImage', imageFile);
      formData.append('sectionType', sectionType);
      
      // Log form data (for debugging)
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? `File (${value.name}, ${value.type}, ${value.size} bytes)` : value}`);
      }
      
      // Make the API request
      const response = await axios.post(`${API_URL}/api/homepage/sections/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        // Add timeout and retry logic
        timeout: 30000, // 30 seconds timeout
        // Add onUploadProgress handler for progress tracking if needed
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });
      
      console.log('Upload response:', response.data);
      
      // Validate the response
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      // Select the best URL from the available options
      let fileUrl;
      
      // Use this order of preference
      if (response.data.alternativeUrl) {
        fileUrl = response.data.alternativeUrl;
        console.log('Using alternative URL:', fileUrl);
      } else if (response.data.fileUrl) {
        fileUrl = response.data.fileUrl;
        console.log('Using standard URL:', fileUrl);
      } else if (response.data.absoluteUrl) {
        fileUrl = response.data.absoluteUrl;
        console.log('Using absolute URL:', fileUrl);
      } else {
        throw new Error('No valid URL received from server');
      }
      
      // Test the URL with a HEAD request
      try {
        const urlToTest = fileUrl.startsWith('http') 
          ? fileUrl 
          : `${window.location.origin}${fileUrl}`;
        
        console.log('Testing URL accessibility:', urlToTest);
        
        // Use image preloading to test if the URL is accessible
        const preloadImage = new Image();
        preloadImage.src = urlToTest;
        
        // Let the browser start loading it - we don't need to wait for completion
      } catch (testError) {
        console.warn('URL test warning (continuing anyway):', testError);
      }
      
      // Return the processed response with properly formatted URL
      return {
        ...response.data,
        fileUrl,
        // Store all URLs for potential fallback use
        allUrls: {
          alternativeUrl: response.data.alternativeUrl,
          standardUrl: response.data.fileUrl,
          absoluteUrl: response.data.absoluteUrl
        }
      };
    } catch (error) {
      console.error('Error uploading section image:', error);
      
      // Detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // Throw a more specific error message
        throw new Error(`Server error (${error.response.status}): ${
          error.response.data?.message || error.message
        }`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        throw new Error('No response received from server. Check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        throw error;
      }
    }
  },
  
  // Get products for admin section editor
  getProductsForEditor: async () => {
    try {
      const response = await homepageSectionApi.get('/admin/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products for editor:', error);
      return [];
    }
  },
  
  // Get categories for admin section editor
  getCategoriesForEditor: async () => {
    try {
      const response = await homepageSectionApi.get('/admin/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories for editor:', error);
      return [];
    }
  }
};

export default homepageSectionService; 