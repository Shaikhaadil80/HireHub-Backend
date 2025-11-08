// middleware/uploadProperty.js
const multer = require('multer');
const { propertyStorage, propertyThumbnailStorage } = require('../config/cloudinaryProperties');

// Configure multer for multiple main images upload
const uploadPropertyImages = multer({
  storage: propertyStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Configure multer for thumbnail upload
const uploadPropertyThumbnail = multer({
  storage: propertyThumbnailStorage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Middleware to handle multiple images and single thumbnail
const uploadPropertyFiles = (req, res, next) => {
  // First upload thumbnail
  console.log("Uploading thumbnail and images");
  uploadPropertyThumbnail.single('thumbnailImage')(req, res, (err) => {
    if (err) {
      return next(err);
    }
    console.log("Thumbnail uploaded");
    console.log("Now uploading main images");
    // Then upload multiple main images
    uploadPropertyImages.array('mainImages', 10)(req, res, (err) => {
      if (err) {
        // Clean up uploaded thumbnail if there's an error with main images
        if (req.file) {
          // You might want to delete the uploaded thumbnail here
        }
        return next(err);
      }
      next();
    });
  });
  console.log("Upload process initiated");
};

// Middleware to handle errors
const handlePropertyUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB per file.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 10 images allowed.'
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next();
};

module.exports = {
  uploadPropertyFiles,
  handlePropertyUploadErrors,
  uploadPropertyImages,
  uploadPropertyThumbnail
};