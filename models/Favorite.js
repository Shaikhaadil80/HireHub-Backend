const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique favorites
favoriteSchema.index({ customerId: 1, propertyId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);