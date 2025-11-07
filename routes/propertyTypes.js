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
const { uploadSingleImage,uploadBothImages, handleUploadErrors } = require('../middleware/upload');

const router = express.Router();

// Public route - get active property types
router.get('/active', getPropertyTypes);

// Firebase protected routes
router.use(verifyFirebaseToken);
router.use(requireUserInDB);

// Admin only routes
// router.use(authorize('admin'));

// Image upload route (separate from create/update)
router.post('/upload-image', uploadSingleImage, handleUploadErrors, uploadPropertyTypeImage);

// Property type CRUD routes with image upload
router.get('/', getPropertyTypes);
router.get('/:id', getPropertyType);
router.post('/', uploadBothImages, handleUploadErrors, createPropertyType);
router.put('/:id', uploadBothImages, handleUploadErrors, updatePropertyType);
router.delete('/:id', deletePropertyType);
router.put('/:id/deactivate', deactivatePropertyType);

module.exports = router;