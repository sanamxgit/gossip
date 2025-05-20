// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
  apiKey: process.env.REACT_APP_CLOUDINARY_API_KEY,
  apiSecret: process.env.REACT_APP_CLOUDINARY_API_SECRET
};

// Validate Cloudinary configuration
export const validateCloudinaryConfig = () => {
  const missingVars = [];
  
  if (!CLOUDINARY_CONFIG.cloudName) missingVars.push('REACT_APP_CLOUDINARY_CLOUD_NAME');
  if (!CLOUDINARY_CONFIG.uploadPreset) missingVars.push('REACT_APP_CLOUDINARY_UPLOAD_PRESET');
  if (!CLOUDINARY_CONFIG.apiKey) missingVars.push('REACT_APP_CLOUDINARY_API_KEY');
  if (!CLOUDINARY_CONFIG.apiSecret) missingVars.push('REACT_APP_CLOUDINARY_API_SECRET');

  if (missingVars.length > 0) {
    console.error('Missing Cloudinary environment variables:', missingVars.join(', '));
    return false;
  }

  return true;
}; 