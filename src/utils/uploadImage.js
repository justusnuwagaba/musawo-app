import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_AUTO_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '../config/cloudinaryConfig';

/** Uploads a local image (picked via expo-image-picker) to Cloudinary and returns its public URL. */
export async function uploadImageToCloudinary(localUri) {
  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    type: 'image/jpeg',
    name: `upload_${Date.now()}.jpg`,
  });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Image upload failed');
  }
  return data.secure_url;
}

/** Uploads a local document (image or PDF, picked via expo-document-picker) to Cloudinary. */
export async function uploadDocumentToCloudinary(localUri, mimeType, fileName) {
  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    type: mimeType || 'application/octet-stream',
    name: fileName || `upload_${Date.now()}`,
  });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_AUTO_UPLOAD_URL, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Document upload failed');
  }
  return { url: data.secure_url, resourceType: data.resource_type };
}
