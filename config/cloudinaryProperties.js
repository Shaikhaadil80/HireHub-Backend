// config/cloudinaryProperties.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Multer Storage for Cloudinary - Main Images
const propertyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hirehub/properties/main',
    format: async (req, file) => 'png',
    public_id: (req, file) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const originalName = file.originalname.split('.')[0];
      return `property-main-${originalName}-${timestamp}-${randomString}`;
    },
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
    ],
  },
});

// For property thumbnail generation
const propertyThumbnailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hirehub/properties/thumbnails',
    format: async (req, file) => 'png',
    public_id: (req, file) => {
      const timestamp = Date.now();
      const originalName = file.originalname.split('.')[0];
      return `property-thumb-${originalName}-${timestamp}`;
    },
    transformation: [
      { width: 400, height: 300, crop: 'fill', quality: 'auto' },
    ],
  },
});

module.exports = {
  propertyStorage,
  propertyThumbnailStorage
};