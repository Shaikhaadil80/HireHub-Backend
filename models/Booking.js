const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  mobileNo: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  propertyRemark: {
    type: String,
    default: ''
  },
  bookforFromDateTime: {
    type: Date,
    required: true
  },
  bookforToDateTime: {
    type: Date,
    required: true
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
    default: ''
  },
  status: {
    type: String,
    enum: ['Requested', 'Booked', 'NotBooked', 'Cancelled', 'Completed'],
    default: 'Requested'
  },
  propertyCost: {
    type: Number,
    required: true
  },
  minAdvanced: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid', 'advancePaid'],
    default: 'unpaid'
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'cheque', 'upi', 'card', ''],
    default: ''
  },
  paymentDateTime: {
    type: Date
  },
  adminRemark: {
    type: String,
    default: ''
  },
  userRemark: {
    type: String,
    default: ''
  },
  nextslot: {
    type: Boolean,
    default: false
  },
  currrentPropertyJson: {
    type: String,
    required: true
  },
  propertyId: {
    type: String,
    required: true
  },
  vendorId: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  durationText: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ propertyId: 1, bookforFromDateTime: 1, bookforToDateTime: 1 });
bookingSchema.index({ vendorId: 1, status: 1 });
bookingSchema.index({ uid: 1, status: 1 });
bookingSchema.index({ bookforFromDateTime: 1, bookforToDateTime: 1 });

// Virtual for checking if booking is upcoming
bookingSchema.virtual('isUpcoming').get(function() {
  return this.bookforFromDateTime > new Date();
});

// Virtual for checking if booking is ongoing
bookingSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.bookforFromDateTime <= now && this.bookforToDateTime >= now;
});

// Virtual for checking if booking is completed
bookingSchema.virtual('isCompleted').get(function() {
  return this.bookforToDateTime < new Date();
});

// Method to check date conflicts
bookingSchema.statics.checkDateConflict = async function(propertyId, fromDateTime, toDateTime, excludeBookingId = null) {
  const query = {
    propertyId: propertyId,
    status: { $in: ['Requested', 'Booked'] },
    $or: [
      {
        bookforFromDateTime: { $lt: toDateTime },
        bookforToDateTime: { $gt: fromDateTime }
      }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await this.findOne(query);
  return !!conflictingBooking;
};

// Method to calculate duration based on unit
bookingSchema.statics.calculateDuration = function(unit, fromDateTime, toDateTime) {
  const from = new Date(fromDateTime);
  const to = new Date(toDateTime);
  const diffMs = to - from;

  switch (unit) {
    case 'per_minute':
      return Math.max(1, Math.ceil(diffMs / (1000 * 60))); // Minimum 1 minute
    case 'per_hour':
      return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60))); // Minimum 1 hour
    case 'per_day':
      return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24))); // Minimum 1 day
    case 'per_month':
      return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30))); // Minimum 1 month (30 days)
    default:
      return 0;
  }
};

// Method to calculate price based on unit and duration
bookingSchema.statics.calculatePrice = function(property, fromDateTime, toDateTime) {
  const duration = this.calculateDuration(property.unit, fromDateTime, toDateTime);
  const baseAmount = property.price * duration;
  const discount = property.discountAmount || 0;
  const totalAmount = baseAmount - discount;

  let durationText = '';
  switch (property.unit) {
    case 'per_minute':
      durationText = `${duration} minute${duration !== 1 ? 's' : ''}`;
      break;
    case 'per_hour':
      durationText = `${duration} hour${duration !== 1 ? 's' : ''}`;
      break;
    case 'per_day':
      durationText = `${duration} day${duration !== 1 ? 's' : ''}`;
      break;
    case 'per_month':
      durationText = `${duration} month${duration !== 1 ? 's' : ''}`;
      break;
  }

  return {
    duration,
    durationText,
    baseAmount,
    discount,
    totalAmount: Math.max(0, totalAmount)
  };
};

module.exports = mongoose.model('Booking', bookingSchema);