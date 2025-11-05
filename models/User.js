const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: [true, 'Firebase UID is required'],
    unique: true,
    trim: true
  },
  userName: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: {
      values: ['candidate', 'employer', 'admin'],
      message: 'User type must be candidate, employer, or admin'
    },
    maxlength: [10, 'User type cannot exceed 10 characters']
  },
  profileImageUrl: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return v === '' || validator.isURL(v);
      },
      message: 'Profile image must be a valid URL'
    }
  },
  profileImageThumbUrl: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return v === '' || validator.isURL(v);
      },
      message: 'Profile image thumb must be a valid URL'
    }
  },
  mobileNo: {
    type: String,
    required: [true, 'Mobile number is required'],
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Mobile number must be 10 digits'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
    maxlength: [50, 'Email cannot exceed 50 characters']
  },
  // Removed password field since we're using Firebase Auth
  firebaseProvider: {
    type: String,
    enum: ['password', 'google.com', 'facebook.com', 'apple.com'],
    default: 'password'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    ref: 'User'
  },
  subscriptionTillDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > new Date();
      },
      message: 'Subscription date must be in the future'
    }
  },
  subscriptionId: {
    type: String,
    maxlength: [50, 'Subscription ID cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ uid: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ userType: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);