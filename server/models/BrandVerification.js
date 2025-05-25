const mongoose = require('mongoose');

const brandVerificationSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brandName: {
    type: String,
    required: true,
    trim: true
  },
  documents: [{
    url: String,
    public_id: String,
    type: {
      type: String,
      enum: ['business_license', 'trademark', 'other'],
      required: true
    },
    description: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const BrandVerification = mongoose.model('BrandVerification', brandVerificationSchema);

module.exports = BrandVerification; 