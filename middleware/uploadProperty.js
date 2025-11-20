// // middleware/uploadProperty.js
// const multer = require('multer');
// const { propertyStorage, propertyThumbnailStorage } = require('../config/cloudinaryProperties');

// // Configure multer for multiple main images upload
// const uploadPropertyImages = multer({
//   storage: propertyStorage,
//   limits: {
//     fileSize: 2 * 1024 * 1024, // 2MB limit per file
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   },
// });

// // Configure multer for thumbnail upload
// const uploadPropertyThumbnail = multer({
//   storage: propertyThumbnailStorage,
//   limits: {
//     fileSize: 1 * 1024 * 1024,
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   },
// });

// // // Middleware to handle multiple images and single thumbnail
// // const uploadPropertyFiles = (req, res, next) => {
// //   // First upload thumbnail
// //   uploadPropertyThumbnail.single('thumbnailImage')(req, res, (err) => {
// //     if (err) {
// //       console.error("Error uploading thumbnail:", err);
// //       return next(err);
// //     }
// //     console.log("Thumbnail uploaded");
// //     // Then upload multiple main images
   
// //   });
  
// //    uploadPropertyImages.array('mainImages', 5)(req, res, (err) => {
// //       if (err) {
// //         // Clean up uploaded thumbnail if there's an error with main images
// //         if (req.file) {
// //           // You might want to delete the uploaded thumbnail here
// //         }
// //         console.error("Error uploading main images:", err);
// //         return next(err);
// //       }
// //       next();
// //     });
// // };

// const uploadPropertyFiles = (req, res, next) => {
//   // 1. First, process the single thumbnail image
//   uploadPropertyThumbnail.single('thumbnailImage')(req, res, (err) => {
//     if (err) {
//       console.error("Error uploading thumbnail:", err);
//       // Immediately pass error to Express error handler
//       return next(err); 
//     }
    
//     // 2. If thumbnail succeeded, process the multiple main images
//     uploadPropertyImages.array('mainImages', 5)(req, res, (err) => {
//       if (err) {
//         console.error("Error uploading main images:", err);
//         // Note: You should handle rollback (deleting the uploaded thumbnail) here
//         return next(err);
//       }
      
//       // 3. If BOTH succeeded, call next() once to move to the controller
//       next();
//     });
//   });
// };

// // Middleware to handle errors
// const handlePropertyUploadErrors = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         error: 'File too large. Maximum size is 5MB per file.'
//       });
//     }
//     if (err.code === 'LIMIT_UNEXPECTED_FILE') {
//       return res.status(400).json({
//         success: false,
//         error: `Unexpected field ${err.message}`
//       });
//     }
//     if (err.code === 'LIMIT_FILE_COUNT') {
//       return res.status(400).json({
//         success: false,
//         error: 'Too many files. Maximum 10 images allowed.'
//       });
//     }
//   } else if (err) {
//     return res.status(400).json({
//       success: false,
//       error: err.message
//     });
//   }
//   next();
// };

// module.exports = {
//   uploadPropertyFiles,
//   handlePropertyUploadErrors,
//   uploadPropertyImages,
//   uploadPropertyThumbnail
// };

// middleware/uploadProperty.js
const multer = require('multer');
const { propertyStorage, propertyThumbnailStorage, allInOneStorage } = require('../config/cloudinaryProperties');

// Configure multer for multiple main images upload
const uploadPropertyImages = multer({
  storage: propertyStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit per file
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
    fileSize: 1 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// // Custom middleware to handle multiple file fields
// const uploadPropertyFiles = (req, res, next) => {
//   // Use multer for multiple fields
//   const uploadThumbnail = uploadPropertyThumbnail.single('thumbnailImage');
//   const uploadMainImages = uploadPropertyImages.array('mainImages', 10); // Max 10 files

//   // First upload thumbnail
//   uploadThumbnail(req, res, (err) => {
//     if (err) {
//       return next(err);
//     }
    
//     // Then upload main images
//     uploadMainImages(req, res, (err) => {
//       if (err) {
//         // Clean up uploaded thumbnail if there's an error with main images
//         if (req.file) {
//           // You might want to delete the uploaded thumbnail here
//         }
//         return next(err);
//       }
//       next();
//     });
//   });
// };
// Sequential handler with custom cleanup logic
const uploadPropertyFiles = (req, res, next) => {
  const uploadThumbnail = uploadPropertyThumbnail.single('thumbnailImage');
  const uploadMainImages = upload.array('mainImages', 10);

  uploadThumbnail(req, res, (err) => {
    if (err) return next(err);

    uploadMainImages(req, res, (err) => {
      if (err) {
        // Custom cleanup if mainImages fail
        if (req.file) {
          try {
            const filePath = req.file.path;
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            console.log('Thumbnail deleted after mainImages error');
          } catch (cleanupErr) {
            console.error('Failed to clean up thumbnail:', cleanupErr);
          }
        }
        return next(err);
      }

      // ✅ Both uploaded successfully
      next();
    });
  });
};
// Alternative approach: Single middleware that handles both fields
const uploadPropertyFilesSingle = multer({
  storage: propertyStorage,
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
  
}).fields([
  { name: 'thumbnailImage', maxCount: 1 },
  { name: 'mainImages', maxCount: 5 }
]);

const allInOneUpload = multer({
  allInOneStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB per file
    files: 6, // 1 thumbnail + up to 5 main images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed!"));
    }
  },
}).fields([
  { name: 'thumbnailImage', maxCount: 1, },
  { name: 'mainImages', maxCount: 5 }
]);

// Middleware to handle errors
const handlePropertyUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 2MB per file.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: `Unexpected field: ${err.field}. Expected 'thumbnailImage' or 'mainImages'.`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 5 images allowed.'
      });
    }
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many form parts.'
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
  uploadPropertyFilesSingle, // Use this one instead
  handlePropertyUploadErrors,
  allInOneUpload,
  uploadPropertyImages,
  uploadPropertyThumbnail
};