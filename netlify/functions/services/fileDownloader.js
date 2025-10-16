/**
 * Downloads a file from a URL and returns it as a Blob
 * @param {string} url - The URL to download from
 * @returns {Promise<Blob>} - The downloaded file as a Blob
 */
const downloadFile = async (url) => {
  try {
    console.log('Downloading file from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('File downloaded successfully, size:', blob.size, 'bytes');
    
    return blob;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error(`Download failed: ${error.message}`);
  }
};

/**
 * Downloads a .glb file and returns it as a Blob
 * @param {string} glbUrl - The URL of the .glb file
 * @returns {Promise<Blob>} - The downloaded .glb file as a Blob
 */
const downloadGlbFile = async (glbUrl) => {
  if (!glbUrl || !glbUrl.includes('.glb')) {
    throw new Error('Invalid .glb URL provided');
  }
  
  return await downloadFile(glbUrl);
};

module.exports = {
  downloadFile,
  downloadGlbFile
};
