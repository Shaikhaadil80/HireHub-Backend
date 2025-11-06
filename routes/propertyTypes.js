const express = require('express');
const {
  getPropertyTypes,
  getPropertyType,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
  deactivatePropertyType
} = require('../controllers/propertyTypeController');
const { verifyFirebaseToken, requireUserInDB } = require('../middleware/firebaseAuth');
const { authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

const router = express.Router();

// Public route - get active property types
router.get('/active', getPropertyTypes);

// Firebase protected routes
router.use(verifyFirebaseToken);
router.use(requireUserInDB);

// Admin only routes
router.use(authorize('admin'));

router.get('/', getPropertyTypes);
router.get('/:id', getPropertyType);
router.post('/', uploadSingle('iconImage'), createPropertyType); // Add upload middleware
router.put('/:id', uploadSingle('iconImage'), updatePropertyType); // Add upload middleware
router.delete('/:id', deletePropertyType);
router.put('/:id/deactivate', deactivatePropertyType);

module.exports = router;