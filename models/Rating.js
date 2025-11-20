const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  bookingId: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one rating per booking
ratingSchema.index({ bookingId: 1 }, { unique: true });

// Index for efficient queries
ratingSchema.index({ propertyId: 1, isActive: 1 });
ratingSchema.index({ customerId: 1, propertyId: 1 });

module.exports = mongoose.model('Rating', ratingSchema);