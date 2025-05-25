const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: false
  },
  logo: {
    type: String,
    required: false
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationDocument: {
    url: String,
    public_id: String,
    uploadedAt: Date
  },
  rejectionReason: {
    type: String
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create slug from name before saving
brandSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

// Method to verify brand
brandSchema.methods.verify = function(adminId) {
  this.verificationStatus = 'verified';
  this.verifiedAt = new Date();
  this.verifiedBy = adminId;
  return this.save();
};

// Method to reject brand verification
brandSchema.methods.reject = function(reason, adminId) {
  this.verificationStatus = 'rejected';
  this.rejectionReason = reason;
  this.verifiedBy = adminId;
  return this.save();
};

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand; 