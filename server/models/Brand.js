const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Brand description is required']
  },
  logo: {
    url: String,
    public_id: String
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documents: [{
    name: String,
    url: String,
    public_id: String,
    type: String // e.g., 'registration', 'license', etc.
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationNotes: String,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  slug: {
    type: String,
    lowercase: true,
    unique: true
  },
  website: {
    type: String,
    trim: true
  },
  officialStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create slug from name before saving
brandSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand; 