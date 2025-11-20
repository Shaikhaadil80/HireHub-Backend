const Rating = require('../models/Rating');
const Property = require('../models/Property');
const Booking = require('../models/Booking'); // Assuming you have Booking model

// @desc    Create rating and review
// @route   POST /api/ratings
// @access  Private/Customer
const createRating = async (req, res) => {
  try {
    const { propertyId, bookingId, rating, review } = req.body;
    const customerId = req.user.uid;
    const customerName = req.user.userName;

    // Check if booking exists and is completed
    const booking = await Booking.findOne({
      _id: bookingId,
      uid: customerId,
      status: 'Completed'
    });

    if (!booking) {
      return res.status(400).json({
        success: false,
        error: 'Booking not found or not completed'
      });
    }

    // Check if rating already exists for this booking
    const existingRating = await Rating.findOne({ bookingId });
    if (existingRating) {
      return res.status(400).json({
        success: false,
        error: 'Rating already submitted for this booking'
      });
    }

    // Create rating
    const newRating = await Rating.create({
      propertyId,
      customerId,
      customerName,
      bookingId,
      rating,
      review
    });

    // Update property rating statistics
    await updatePropertyRating(propertyId);

    res.status(201).json({
      success: true,
      data: newRating,
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while submitting rating'
    });
  }
};

// @desc    Get ratings for a property
// @route   GET /api/ratings/property/:propertyId
// @access  Public
const getPropertyRatings = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const ratings = await Rating.find({ 
      propertyId, 
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rating.countDocuments({ 
      propertyId, 
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching ratings'
    });
  }
};

// @desc    Check if user can rate a property
// @route   GET /api/ratings/can-rate/:propertyId
// @access  Private/Customer
const checkCanRate = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const customerId = req.user.uid;

    // Find completed bookings for this property and customer
    const completedBookings = await Booking.find({
      propertyId,
      uid: customerId,
      status: 'Completed'
    });

    const canRateBookings = [];

    for (const booking of completedBookings) {
      const existingRating = await Rating.findOne({ bookingId: booking._id });
      if (!existingRating) {
        canRateBookings.push({
          bookingId: booking._id,
          bookingDate: booking.createdAt,
          // Add other booking details you want to show
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        canRate: canRateBookings.length > 0,
        bookings: canRateBookings
      }
    });
  } catch (error) {
    console.error('Check can rate error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while checking rating eligibility'
    });
  }
};

// Helper function to update property rating statistics
const updatePropertyRating = async (propertyId) => {
  try {
    const ratings = await Rating.find({ propertyId, isActive: true });
    
    if (ratings.length > 0) {
      const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      const averageRating = totalRating / ratings.length;
      const totalReviews = ratings.filter(r => r.review && r.review.trim()).length;

      await Property.findByIdAndUpdate(propertyId, {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalRatings: ratings.length,
        totalReviews
      });
    }
  } catch (error) {
    console.error('Update property rating error:', error);
  }
};

module.exports = {
  createRating,
  getPropertyRatings,
  checkCanRate
};