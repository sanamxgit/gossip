import axios from 'axios';
import { API_URL } from '../../config';
import SHA1 from 'crypto-js/sha1';
import enc from 'crypto-js/enc-hex';
import { CLOUDINARY_CONFIG, validateCloudinaryConfig } from '../../config/cloudinary';

// Function to generate Cloudinary API signature
const generateCloudinarySignature = (publicId, timestamp) => {
  const str = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_CONFIG.apiSecret}`;
  return SHA1(str).toString(enc);
};

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
      console.log("Creating product with data:", productData);
      
      // If category is provided as an object with id, extract the id
      if (productData.category && typeof productData.category === 'object' && productData.category._id) {
        productData.category = productData.category._id;
      }
      
      // Create a new FormData instance
      const formData = new FormData();
      
      // Process arModels to ensure they have the correct structure before adding to FormData
      let processedArModels = { ios: {}, android: {} };
      
      if (productData.arModels) {
        // Make sure iOS model has the right structure (url and public_id)
        if (productData.arModels.ios) {
          const iosModel = productData.arModels.ios;
          processedArModels.ios = {
            url: typeof iosModel === 'string' ? iosModel : iosModel.url || '',
            public_id: typeof iosModel === 'string' ? 
              (iosModel.split('/').pop() || '') : 
              (iosModel.public_id || iosModel.url?.split('/').pop() || '')
          };
        }
        
        // Make sure Android model has the right structure (url and public_id)
        if (productData.arModels.android) {
          const androidModel = productData.arModels.android;
          processedArModels.android = {
            url: typeof androidModel === 'string' ? androidModel : androidModel.url || '',
            public_id: typeof androidModel === 'string' ? 
              (androidModel.split('/').pop() || '') : 
              (androidModel.public_id || androidModel.url?.split('/').pop() || '')
          };
        }
      }
      
      console.log("Processed AR models:", processedArModels);
      
      // Add all product data except images
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && key !== 'arModels') {
          if (typeof productData[key] === 'object') {
            formData.append(key, JSON.stringify(productData[key]));
          } else {
            formData.append(key, productData[key]);
          }
        }
      });
      
      // Add properly structured arModels to FormData
      formData.append('arModels', JSON.stringify(processedArModels));
      
      // Handle images array - IMPORTANT CHANGE: Append each image field individually
      if (Array.isArray(productData.images) && productData.images.length > 0) {
        // First, ensure each image has url and public_id
        const formattedImages = productData.images.map((img, idx) => {
          // If image is already an object with url and public_id, return as is
          if (img && typeof img === 'object' && img.url && img.public_id) {
            console.log(`Image ${idx} is valid with url and public_id:`, img);
            return img;
          }
          // If image is a string (URL), create proper format
          if (typeof img === 'string') {
            const publicId = img.split('/').pop().split('.')[0]; // Extract public_id from URL
            console.log(`Image ${idx} is string URL, created public_id:`, publicId);
            return {
              url: img,
              public_id: publicId
            };
          }
          console.error(`Image ${idx} is invalid:`, img);
          return null;
        }).filter(img => img !== null); // Remove any null values

        console.log("Formatted images for submission:", formattedImages);

        // Add images count to FormData for validation
        formData.append('imagesCount', formattedImages.length.toString());
        
        // Append each image individually with indexed properties
        formattedImages.forEach((img, index) => {
          formData.append(`images[${index}][url]`, img.url);
          formData.append(`images[${index}][public_id]`, img.public_id);
        });
      } else {
        console.warn("No images array provided in productData");
        formData.append('imagesCount', '0');
      }
      
      // Log the formData contents for debugging
      console.log("Form data entries:");
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      
      const response = await productApi.post('/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      console.error('Error response:', error.response?.data);
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
      
      // Create a new FormData instance for update
      const formData = new FormData();
      
      // Process arModels to ensure they have the correct structure
      let processedArModels = { ios: {}, android: {} };
      
      if (productData.arModels) {
        // Make sure iOS model has the right structure (url and public_id)
        if (productData.arModels.ios) {
          const iosModel = productData.arModels.ios;
          processedArModels.ios = {
            url: typeof iosModel === 'string' ? iosModel : iosModel.url || '',
            public_id: typeof iosModel === 'string' ? 
              (iosModel.split('/').pop() || '') : 
              (iosModel.public_id || iosModel.url?.split('/').pop() || '')
          };
        }
        
        // Make sure Android model has the right structure (url and public_id)
        if (productData.arModels.android) {
          const androidModel = productData.arModels.android;
          processedArModels.android = {
            url: typeof androidModel === 'string' ? androidModel : androidModel.url || '',
            public_id: typeof androidModel === 'string' ? 
              (androidModel.split('/').pop() || '') : 
              (androidModel.public_id || androidModel.url?.split('/').pop() || '')
          };
        }
      }
      
      console.log("Processed AR models for update:", processedArModels);
      
      // Add all product data except images and arModels
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && key !== 'arModels') {
          if (typeof productData[key] === 'object') {
            formData.append(key, JSON.stringify(productData[key]));
          } else {
            formData.append(key, productData[key]);
          }
        }
      });
      
      // Add properly structured arModels to FormData
      formData.append('arModels', JSON.stringify(processedArModels));
      
      // Handle images array - using indexed properties in FormData
      if (Array.isArray(productData.images) && productData.images.length > 0) {
        // Ensure each image has url and public_id
        const formattedImages = productData.images.map((img, idx) => {
          // If image is already an object with url and public_id, return as is
          if (img && typeof img === 'object' && img.url && img.public_id) {
            console.log(`Image ${idx} is valid with url and public_id:`, img);
            return img;
          }
          // If image is a string (URL), create proper format
          if (typeof img === 'string') {
            const publicId = img.split('/').pop().split('.')[0]; // Extract public_id from URL
            console.log(`Image ${idx} is string URL, created public_id:`, publicId);
            return {
              url: img,
              public_id: publicId
            };
          }
          console.error(`Image ${idx} is invalid:`, img);
          return null;
        }).filter(img => img !== null); // Remove any null values

        console.log("Formatted images for update:", formattedImages);
        
        // Add images count to FormData for validation
        formData.append('imagesCount', formattedImages.length.toString());
        
        // Append each image individually with indexed properties
        formattedImages.forEach((img, index) => {
          formData.append(`images[${index}][url]`, img.url);
          formData.append(`images[${index}][public_id]`, img.public_id);
        });
      } else {
        console.warn("No images array provided in productData update");
        formData.append('imagesCount', '0');
      }
      
      // Log the formData contents for debugging
      console.log("Form data entries for update:");
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      
      const response = await productApi.put(`/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${productId}:`, error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Delete a product (seller/admin only)
  deleteProduct: async (productId) => {
    try {
      // First get the product details to get image information
      const response = await productApi.get(`/${productId}`);
      const product = response.data;

      // Delete images from Cloudinary if they exist
      if (product.images && Array.isArray(product.images)) {
        for (const image of product.images) {
          if (image && image.public_id) {
            try {
              // Use the productApi instance for consistent headers
              await productApi.delete(`/upload/${encodeURIComponent(image.public_id)}`);
            } catch (imageError) {
              console.error('Error deleting image from Cloudinary:', imageError);
              // Continue with product deletion even if image deletion fails
            }
          }
        }
      }

      // Delete the product
      const deleteResponse = await productApi.delete(`/${productId}`);
      return deleteResponse.data;
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to delete product');
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
  },

  // Upload a product image
  uploadProductImage: async (options) => {
    try {
      if (options.method === 'DELETE') {
        // Check if the public_id appears to be a path containing folders
        const hasFolder = options.public_id.includes('/');
        
        // For direct Cloudinary deletion use the new dedicated route
        if (hasFolder) {
          console.log(`Using direct Cloudinary delete for: ${options.public_id}`);
          const response = await productApi.delete(`/upload/cloudinary/${encodeURIComponent(options.public_id)}`);
          return response.data;
        }
        
        // For simple IDs use the existing image/:public_id endpoint
        console.log(`Using product image delete for: ${options.public_id}`);
        const response = await productApi.delete(`/image/${options.public_id}`);
        return response.data;
      }

      const formData = new FormData();
      formData.append('file', options.file);
      
      const response = await productApi.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error handling product image:', error);
      throw error;
    }
  },

  // Upload a 3D model
  uploadModel: async (file, platform) => {
    try {
      // Debug logging for file and request details
      console.log('Starting model upload:', {
        filename: file.name,
        type: file.type,
        size: file.size,
        platform
      });

      // Create FormData object
      const formData = new FormData();
      
      // Append the file with the correct file name
      formData.append('file', file);
      
      // Explicitly add the platform
      formData.append('platform', platform);
      
      console.log('Sending model upload request with FormData containing:',
        [...formData.entries()].map(entry => {
          if (entry[1] instanceof File) {
            return `${entry[0]}: File(${entry[1].name}, ${entry[1].type}, ${entry[1].size} bytes)`;
          }
          return `${entry[0]}: ${entry[1]}`;
        })
      );

      // Make the API request with increased timeout
      const response = await productApi.post('/upload/model', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000, // 60 second timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      console.log('Model upload response:', response.data);

      if (!response.data || !response.data.secure_url) {
        throw new Error('Invalid response from server: Missing secure_url');
      }

      // Return the model data in the correct format
      return {
        url: response.data.secure_url,
        public_id: response.data.public_id,
        platform: response.data.platform || platform
      };
    } catch (error) {
      console.error('Model upload error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw new Error(`Upload failed: ${error.message}`);
    }
  },

  // Delete a 3D model from Cloudinary
  deleteModel: async (publicId) => {
    try {
      if (!validateCloudinaryConfig()) {
        throw new Error('Cloudinary configuration is incomplete. Please check your environment variables.');
      }

      const timestamp = Math.round((new Date()).getTime() / 1000);
      const signature = generateCloudinarySignature(publicId, timestamp);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/delete_by_token`,
        {
          public_id: publicId,
          api_key: CLOUDINARY_CONFIG.apiKey,
          timestamp,
          signature
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error deleting 3D model:', error);
      throw new Error('Failed to delete 3D model');
    }
  },
};

export default productService; 