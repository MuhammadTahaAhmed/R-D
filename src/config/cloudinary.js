// Cloudinary client-side configuration
// Replace with your Cloudinary details or use env variables in production

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "", // unsigned preset
};

export function validateCloudinaryConfig() {
  if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
    console.error("Cloudinary config missing: ensure cloudName and uploadPreset are set");
    return false;
  }
  return true;
}


