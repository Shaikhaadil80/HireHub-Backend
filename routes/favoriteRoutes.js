const express = require('express');
const {
  addToFavorites,
  removeFromFavorites,
  getCustomerFavorites,
  checkIsFavorite,
  getCustomerFavoritesWithDetails,
} = require('../controllers/favoriteController');
const { verifyFirebaseToken, requireUserInDB } = require('../middleware/firebaseAuth');

const router = express.Router();

// Protected routes
router.use(verifyFirebaseToken);
router.use(requireUserInDB);

router.post('/', addToFavorites);
router.delete('/:propertyId', removeFromFavorites);
router.get('/', getCustomerFavorites);

router.get('/details', getCustomerFavoritesWithDetails); // Add this route
router.get('/check/:propertyId', checkIsFavorite);

module.exports = router;