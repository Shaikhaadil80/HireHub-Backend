// routes/propertyRoutes.js
const express = require('express');
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  deactivateProperty,
  uploadPropertyImages
} = require('../controllers/propertyController');
const { verifyFirebaseToken, requireUserInDB } = require('../middleware/firebaseAuth');
const { authorize } = require('../middleware/auth');
const { uploadPropertyFiles, handlePropertyUploadErrors } = require('../middleware/uploadProperty');

const router = express.Router();

// Public route - get active properties
router.get('/active', getProperties);

// Firebase protected routes
router.use(verifyFirebaseToken);
router.use(requireUserInDB);

// Admin only routes
// router.use(authorize('admin'));

// Image upload route (separate from create/update)
router.post('/upload-images', uploadPropertyFiles, handlePropertyUploadErrors, uploadPropertyImages);

// Property CRUD routes with image upload
router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', uploadPropertyFiles, handlePropertyUploadErrors, createProperty);
router.put('/:id', uploadPropertyFiles, handlePropertyUploadErrors, updateProperty);
router.delete('/:id', deleteProperty);
router.put('/:id/deactivate', deactivateProperty);

module.exports = router;