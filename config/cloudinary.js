const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hirehub/property-types',
    format: async (req, file) => 'png', // supports promises as well
    public_id: (req, file) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);

      const originalName = file.originalname.split('.')[0];
      return `${file.fieldname}-${originalName}-${timestamp}-${randomString}`;
      return `property-type-${originalName}-${timestamp}`;
    },
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto' }, // Main image
    ],
  },
});

// For thumbnail generation
const thumbnailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hirehub/property-types/thumbnails',
    format: async (req, file) => 'png',
    public_id: (req, file) => {
      const timestamp = Date.now();
      const originalName = file.originalname.split('.')[0];
      return `${file.fieldname}-${originalName}-${timestamp}-${randomString}`;
      return `property-type-thumb-${originalName}-${timestamp}`;
    },
    transformation: [
      { width: 200, height: 200, crop: 'thumb', quality: 'auto'  }, // Thumbnail
    ],
  },
});

module.exports = {
  cloudinary,
  storage,
  thumbnailStorage
}; 