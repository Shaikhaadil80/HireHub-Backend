const express = require('express');
const {
  createUser,
  getCurrentUser,
  updateUser,
  checkUserExists,
  getUserById,
  checkUserProfileExists
} = require('../controllers/userController');
const { verifyFirebaseToken, requireUserInDB } = require('../middleware/firebaseAuth');

const router = express.Router();

// Public routes
router.get('/check-email/:email', checkUserExists);

// Firebase protected routes
router.use(verifyFirebaseToken);


// Profile check route (used by frontend)
router.get('/check-profile/:uid', checkUserProfileExists);

// User profile management
router.post('/', createUser);
router.get('/me', requireUserInDB, getCurrentUser);
router.put('/me', requireUserInDB, updateUser);
router.get('/:id', requireUserInDB, getUserById);

module.exports = router;