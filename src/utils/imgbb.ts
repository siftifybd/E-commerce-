/**
 * BD SHOPS — ImgBB Image Upload Utility
 * Handles image upload to ImgBB API and returns direct URL
 */

const IMGBB_API_KEY = '60ec8eea3ec1abc8d43d202bc70e49e8';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: number;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Uploads a file (File object or base64) to ImgBB
 */
export async function uploadImageToImgBB(file: File | string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);

    if (typeof file === 'string') {
      // If base64 string, clean prefix if present
      const cleanBase64 = file.replace(/^data:image\/\w+;base64,/, '');
      formData.append('image', cleanBase64);
    } else {
      formData.append('image', file);
    }

    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ImgBB upload failed with status ${response.status}`);
    }

    const result: ImgBBResponse = await response.json();

    if (result.success && result.data && result.data.url) {
      return result.data.url;
    } else {
      throw new Error('ImgBB API returned unsuccessful response');
    }
  } catch (error) {
    console.error('ImgBB Upload Error:', error);
    throw error;
  }
}
