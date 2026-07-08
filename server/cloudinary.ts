import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

function initCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dkd5jmq2d';
  const apiKey = process.env.CLOUDINARY_API_KEY || '845684616653357';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || 'oDfn_scXwTeGO0Wz7I3kSvXi7I8';

  if (cloudName && apiKey && apiSecret) {
    try {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });
      isConfigured = true;
      console.log('[CLOUDINARY] Successfully initialized with:', cloudName);
    } catch (err) {
      console.error('[CLOUDINARY] Initialization error:', err);
    }
  } else {
    console.warn('[CLOUDINARY] Credentials missing. Image uploads will fall back to local/placeholder storage.');
  }
}

export async function uploadToCloudinary(fileStr: string): Promise<string> {
  if (!isConfigured) {
    initCloudinary();
  }

  if (!isConfigured) {
    console.log('[CLOUDINARY] Fallback mode active. Returning mock/local representation.');
    if (fileStr.startsWith('data:')) {
      if (fileStr.length < 150000) {
        return fileStr; 
      } else {
        return 'https://images.unsplash.com/photo-1540747737956-378724044432?w=500&auto=format&fit=crop&q=60';
      }
    }
    return fileStr || 'https://images.unsplash.com/photo-1540747737956-378724044432?w=500&auto=format&fit=crop&q=60';
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: 'betepro'
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('[CLOUDINARY] Upload failed:', error);
    throw error;
  }
}
