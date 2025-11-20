const mongoose = require('mongoose');

const propertyTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Property type name is required'],
    trim: true, 
    maxlength: [50, 'Property type name cannot exceed 50 characters'],
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  iconImageUrl: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return v === '' || /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Icon image must be a valid URL'
    }
  },
  iconImageThumbUrl: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return v === '' || /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Icon image thumb must be a valid URL'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEditable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
propertyTypeSchema.index({ name: 1 });
propertyTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model('PropertyType', propertyTypeSchema);