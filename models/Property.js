// models/Property.js
const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true,
    maxlength: [100, 'Property name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Property description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  iconImageUrls: [{
    type: String,
    required: true
  }],
  iconImageThumbUrl: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: [true, 'Price unit is required'],
    enum: ['per_minute', 'per_hour', 'per_day', 'per_month'],
    default: 'per_hour'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  minAdvanceBookingAmount: {
    type: Number,
    required: [true, 'Minimum advance booking amount is required'],
    min: [0, 'Minimum advance booking amount cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    required: true
  }
});

// Update the updatedAt field before saving
propertySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Property', propertySchema);