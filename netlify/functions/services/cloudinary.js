// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET
};

/**
 * Validates that all required Cloudinary configuration is present
 * @returns {boolean} - True if configuration is valid
 */
const validateCloudinaryConfig = () => {
  const required = ['cloudName', 'uploadPreset'];
  const missing = required.filter(key => !CLOUDINARY_CONFIG[key]);
  
  if (missing.length > 0) {
    console.error('Missing Cloudinary configuration:', missing);
    return false;
  }
  
  return true;
};

module.exports = {
  CLOUDINARY_CONFIG,
  validateCloudinaryConfig
};
