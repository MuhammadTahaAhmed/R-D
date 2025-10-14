import { downloadGlbFile } from './fileDownloader';
import { uploadGlbToCloudinary } from './cloudinaryUploader';

/**
* Processes an avatar by downloading the .glb file and uploading it to Cloudinary
* @param {string} glbUrl - The URL of the .glb file
* @param {string} avatarId - The avatar ID
* @param {function} onProgress - Progress callback (0-100)
* @returns {Promise<{originalUrl: string, cloudinaryUrl: string, avatarId: string}>}
*/
export const processAvatar = async (glbUrl, avatarId, onProgress = null) => {
  try {
    console.log('Starting avatar processing for:', glbUrl);
    
    // Update progress: Download started
    if (onProgress) onProgress(10);
    
    // Download the .glb file
    const glbBlob = await downloadGlbFile(glbUrl);
    
    // Update progress: Download completed
    if (onProgress) onProgress(30);
    
    // Upload to Cloudinary
    const cloudinaryUrl = await uploadGlbToCloudinary(glbBlob, avatarId, (uploadProgress) => {
      // Map upload progress (0-100) to overall progress (30-100)
      const overallProgress = 30 + (uploadProgress * 0.7);
      if (onProgress) onProgress(overallProgress);
    });
    
    // Update progress: Upload completed
    if (onProgress) onProgress(100);
    
    console.log('Avatar processing completed successfully');
    
    return {
      originalUrl: glbUrl,
      cloudinaryUrl: cloudinaryUrl,
      avatarId: avatarId
    };
  } catch (error) {
    console.error('Error processing avatar:', error);
    throw new Error(`Avatar processing failed: ${error.message}`);
  }
};
