const Favorite = require('../models/Favorite');
const Property = require('../models/Property');

// @desc    Add property to favorites
// @route   POST /api/favorites
// @access  Private/Customer
const addToFavorites = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const customerId = req.user.uid;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({ customerId, propertyId });
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        error: 'Property already in favorites'
      });
    }

    const favorite = await Favorite.create({
      customerId,
      propertyId
    });

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Property added to favorites'
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while adding to favorites'
    });
  }
};

// @desc    Remove property from favorites
// @route   DELETE /api/favorites/:propertyId
// @access  Private/Customer
const removeFromFavorites = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const customerId = req.user.uid;

    const favorite = await Favorite.findOneAndDelete({ customerId, propertyId });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: 'Favorite not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'Property removed from favorites'
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while removing from favorites'
    });
  }
};

// @desc    Get customer favorites
// @route   GET /api/favorites
// @access  Private/Customer
const getCustomerFavorites = async (req, res) => {
  try {
    const customerId = req.user.uid;
    const { page = 1, limit = 10 } = req.query;

    const favorites = await Favorite.find({ customerId })
      .populate('propertyId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter out null properties if any were deleted
    const validFavorites = favorites.filter(fav => fav.propertyId);

    const total = await Favorite.countDocuments({ customerId });

    res.status(200).json({
      success: true,
      data: validFavorites.map(fav => fav.propertyId),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching favorites'
    });
  }
};

// @desc    Check if property is in favorites
// @route   GET /api/favorites/check/:propertyId
// @access  Private/Customer
const checkIsFavorite = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const customerId = req.user.uid;

    const favorite = await Favorite.findOne({ customerId, propertyId });

    res.status(200).json({
      success: true,
      data: {
        isFavorite: !!favorite
      }
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while checking favorite status'
    });
  }
};

// @desc    Get customer favorites with full property details and ratings
// @route   GET /api/favorites/details
// @access  Private/Customer
const getCustomerFavoritesWithDetails = async (req, res) => {
  try {
    const customerId = req.user.uid;
    const { page = 1, limit = 10 } = req.query;

    // Get favorites with populated property details
    const favorites = await Favorite.find({ customerId })
      .populate('propertyId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter out null properties and map to property objects
    const favoriteProperties = favorites
      .filter(fav => fav.propertyId && fav.propertyId.isActive)
      .map(fav => ({
        ...fav.propertyId.toObject(),
        isFavorite: true // Since these are favorites
      }));

    const total = await Favorite.countDocuments({ customerId });

    res.status(200).json({
      success: true,
      data: favoriteProperties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get favorites with details error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching favorites'
    });
  }
};

module.exports = {
  addToFavorites,
  getCustomerFavoritesWithDetails,
  removeFromFavorites,
  getCustomerFavorites,
  checkIsFavorite
};