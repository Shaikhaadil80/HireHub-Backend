const express = require('express');
const {
  getPropertyTypes,
  getPropertyType,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
  deactivatePropertyType,
  uploadPropertyTypeImage
} = require('../controllers/propertyTypeController');
const { verifyFirebaseToken, requireUserInDB } = require('../middleware/firebaseAuth');
const { authorize } = require('../middleware/auth');
const { uploadSingleImage, uploadThumbnailImage, handleUploadErrors } = require('../middleware/upload');

const router = express.Router();

// Public route - get active property types
router.get('/active', getPropertyTypes);

// Firebase protected routes
router.use(verifyFirebaseToken);
router.use(requireUserInDB);

// Admin only routes
// router.use(authorize('admin'));

// Image upload route (separate from create/update)
router.post('/upload-image', [uploadSingleImage, uploadThumbnailImage], handleUploadErrors, uploadPropertyTypeImage);

// Property type CRUD routes with image upload
router.get('/', getPropertyTypes);
router.get('/:id', getPropertyType);
router.post('/', [uploadSingleImage, uploadThumbnailImage], handleUploadErrors, createPropertyType);
router.put('/:id', [uploadSingleImage, uploadThumbnailImage], handleUploadErrors, updatePropertyType);
router.delete('/:id', deletePropertyType);
router.put('/:id/deactivate', deactivatePropertyType);

module.exports = router;