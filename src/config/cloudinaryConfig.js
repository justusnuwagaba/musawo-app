// Free-tier image hosting used for profile pictures, chosen specifically to
// avoid needing the paid Firebase Blaze plan (required for Firebase Storage
// on this project). Uses an UNSIGNED upload preset — safe to call directly
// from the client since it never needs the Cloudinary API secret.
export const CLOUDINARY_CLOUD_NAME = 'dkqu1met';
export const CLOUDINARY_UPLOAD_PRESET = 'ps0bf7sy';
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
// Auto-detects resource type — used for doctor-application documents, which
// can be an image or a PDF. Confirmed the preset accepts PDFs through this
// endpoint (test upload, 2026-07-23), no dashboard change needed.
export const CLOUDINARY_AUTO_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
