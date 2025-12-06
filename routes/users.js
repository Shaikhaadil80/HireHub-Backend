const express = require('express');
const {
  createUser,
  getCurrentUser,
  updateUser,
  checkUserExists,
  getUserById,
  checkUserProfileExists,
  deleteUser,
  permanentDeleteUser
} = require('../controllers/userController');
const { verifyFirebaseToken, requireUserInDB } = require('../middleware/firebaseAuth');

const router = express.Router();

// Public routes
router.get('/check-email/:email', checkUserExists);

// Firebase protected routes
router.use(verifyFirebaseToken);



// User profile management
router.post('/', createUser);
router.get('/me', requireUserInDB, getCurrentUser);
router.put('/me', requireUserInDB, updateUser);
// Delete user account (soft delete - available to user)
router.delete('/me', requireUserInDB, deleteUser);
// Profile check route (used by frontend)
router.get('/check-profile/:uid', checkUserProfileExists);
router.get('/:id', requireUserInDB, getUserById);
// Permanent delete (admin only - optional)
router.delete('/:id/permanent', verifyFirebaseToken, requireUserInDB, permanentDeleteUser);

module.exports = router;