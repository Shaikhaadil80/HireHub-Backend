const express = require('express');
const {
  createRating,
  getPropertyRatings,
  checkCanRate
} = require('../controllers/ratingController');
const { verifyFirebaseToken, requireUserInDB } = require('../middleware/firebaseAuth');

const router = express.Router();

// Public routes
router.get('/property/:propertyId', getPropertyRatings);

// Protected routes
router.use(verifyFirebaseToken);
router.use(requireUserInDB);

router.post('/', createRating);
router.get('/can-rate/:propertyId', checkCanRate);

module.exports = router;