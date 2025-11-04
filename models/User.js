const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
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
    validate: {
      validator: function(v) {
        return v === '' || validator.isURL(v);
      },
      message: 'Profile image must be a valid URL'
    }
  },
  profileImageThumbUrl: {
    type: String,
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
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password not required for Google auth
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  googleId: {
    type: String,
    sparse: true
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

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ uid: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to generate UID
userSchema.methods.generateUID = function() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${randomStr}`;
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', userSchema);