// config/cloudinaryProperties.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const fs = require('fs');

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
      return `${file.fieldname}-${originalName}-${timestamp}-${randomString}`;
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
      return `${file.fieldname}-${originalName}-${timestamp}`;
      return `property-thumb-${originalName}-${timestamp}`;
    },
    transformation: [
      { width: 400, height: 300, crop: 'fill', quality: 'auto' },
    ],
  },
});

// Ensure folders exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// 🗂️ Multer Storage Configuration
// -----------------------------
const allInOneStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others/";

    if (file.fieldname === "thumbnailImage") folder = "uploads/thumbnails/";
    else if (file.fieldname === "mainImages") folder = "uploads/main/";

    ensureDir(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

module.exports = {
  propertyStorage,
  propertyThumbnailStorage,
  allInOneStorage,
};