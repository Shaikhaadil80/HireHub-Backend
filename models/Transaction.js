const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'cheque', 'upi'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'advancePaid', 'unpaid'],
    required: true
  },
  transactionType: {
    type: String,
    enum: ['full_payment', 'advance_payment', 'remaining_payment'],
    required: true
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  referenceNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String, // admin user ID
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate reference number before save
TransactionSchema.pre('save', function(next) {
  if (!this.referenceNumber) {
    this.referenceNumber = `TXN${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);