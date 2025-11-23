const mongoose = require('mongoose');

const testDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TestData', testDataSchema, 'testDataBase');
