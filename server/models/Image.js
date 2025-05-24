const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['banner', 'trending']
  },
  url: {
    type: String,
    required: true
  },
  public_id: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Image', imageSchema); 