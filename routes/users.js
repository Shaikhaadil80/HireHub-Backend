const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
  checkUserExists 
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.put('/:id/deactivate', authorize('admin'), deactivateUser);
// Public route - no authentication needed
router.get('/check-email/:email', checkUserExists);

module.exports = router;