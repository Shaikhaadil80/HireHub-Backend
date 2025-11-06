// const express = require('express');
// const {
//   getPropertyTypes,
//   getPropertyType,
//   createPropertyType,
//   updatePropertyType,
//   deletePropertyType,
//   deactivatePropertyType
// } = require('../controllers/propertyTypeController');
// const { verifyFirebaseToken, requireUserInDB } = require('../middleware/firebaseAuth');
// const { authorize } = require('../middleware/auth');
// const { uploadSingle } = require('../middleware/upload');

// const router = express.Router();

// // Public route - get active property types
// router.get('/active', getPropertyTypes);

// // Firebase protected routes
// router.use(verifyFirebaseToken);
// router.use(requireUserInDB);

// // Admin only routes
// router.use(authorize('admin'));

// router.get('/', getPropertyTypes);
// router.get('/:id', getPropertyType);
// router.post('/', uploadSingle('iconImage'), createPropertyType); // Add upload middleware
// router.put('/:id', uploadSingle('iconImage'), updatePropertyType); // Add upload middleware
// router.delete('/:id', deletePropertyType);
// router.put('/:id/deactivate', deactivatePropertyType);

// module.exports = router;

const express = require('express');
const {
  getPropertyTypes,
  getPropertyType,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
  deactivatePropertyType
} = require('../controllers/propertyTypeController');
const { verifyFirebaseToken, requireUserInDB, authorize } = require('../middleware/firebaseAuth');
const { uploadSingle } = require('../middleware/upload');

const router = express.Router();

// Public route - get active property types
router.get('/active', getPropertyTypes);

// Apply Firebase authentication to all routes below
router.use(verifyFirebaseToken);

// Routes that require user to exist in database and be admin
router.post('/', requireUserInDB, authorize('admin'), uploadSingle('iconImage'), createPropertyType);
router.put('/:id', requireUserInDB, authorize('admin'), uploadSingle('iconImage'), updatePropertyType);
router.delete('/:id', requireUserInDB, authorize('admin'), deletePropertyType);
router.put('/:id/deactivate', requireUserInDB, authorize('admin'), deactivatePropertyType);

// Routes that are public for authenticated users but have different access levels
router.get('/', getPropertyTypes); // All users can see, but filtering happens in controller
router.get('/:id', getPropertyType); // All users can see, but filtering happens in controller

module.exports = router;