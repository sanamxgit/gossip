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
    trim: true
  },
  logo: {
    type: String,
    default: ''
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
  isVerified: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
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