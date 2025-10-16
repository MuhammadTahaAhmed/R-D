const { downloadGlbFile } = require('./services/fileDownloader');
const { uploadGlbToCloudinary } = require('./services/cloudinaryUploader');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { modelUrl } = body;

    if (!modelUrl) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No model URL provided' }),
      };
    }

    console.log('Processing 3D model URL:', modelUrl);

    // Download the .glb file from the URL
    const glbBlob = await downloadGlbFile(modelUrl);
    
    // Generate a unique avatar ID
    const avatarId = `avatar-${Date.now()}`;
    
    // Upload to Cloudinary
    const cloudinaryUrl = await uploadGlbToCloudinary(glbBlob, avatarId);
    
    console.log('Model uploaded to Cloudinary:', cloudinaryUrl);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        originalUrl: modelUrl,
        cloudinaryUrl: cloudinaryUrl,
        avatarId: avatarId,
        message: '3D model successfully uploaded to Cloudinary'
      }),
    };
    
  } catch (err) {
    console.error('Server error:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
