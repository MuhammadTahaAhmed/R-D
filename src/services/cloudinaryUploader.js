import { CLOUDINARY_CONFIG, validateCloudinaryConfig } from '../config/cloudinary';

/**
 * Uploads a Blob (GLB) to Cloudinary using unsigned upload (resource_type: raw)
 * @param {Blob} fileBlob
 * @param {string} fileName
 * @param {(progress:number)=>void} onProgress
 * @returns {Promise<string>} - Secure URL of uploaded file
 */
export const uploadToCloudinary = async (fileBlob, fileName, onProgress = null) => {
  if (!validateCloudinaryConfig()) {
    throw new Error('Cloudinary configuration is missing');
  }

  const form = new FormData();
  form.append('file', fileBlob, fileName);
  form.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  // ensure raw for .glb
  form.append('resource_type', 'raw');
  form.append('public_id', fileName.replace(/\.[^/.]+$/, ''));

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/raw/upload`;

  // fetch does not provide native progress; we can simulate simple staged updates
  if (onProgress) onProgress(50);

  const res = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText} - ${text}`);
  }

  const data = await res.json();
  if (onProgress) onProgress(100);
  return data.secure_url || data.url;
};

export const uploadGlbToCloudinary = async (glbBlob, avatarId, onProgress = null) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `avatar-${avatarId}-${timestamp}.glb`;
  return uploadToCloudinary(glbBlob, fileName, onProgress);
};


