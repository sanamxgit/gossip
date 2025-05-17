const mongoose = require('mongoose');

const homeSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Section title is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Section type is required'],
    enum: ['featured', 'new-arrivals', 'best-sellers', 'category-products', 'banner', 'custom'],
    default: 'custom'
  },
  description: {
    type: String,
    trim: true
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  layout: {
    type: String,
    enum: ['grid', 'carousel', 'banner', 'collection'],
    default: 'grid'
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: function() {
      return this.type === 'category-products';
    }
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  backgroundImage: {
    type: String
  },
  backgroundColor: {
    type: String,
    default: '#ffffff'
  },
  textColor: {
    type: String,
    default: '#000000'
  },
  buttonText: {
    type: String
  },
  buttonLink: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
homeSectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const HomeSection = mongoose.model('HomeSection', homeSectionSchema);

module.exports = HomeSection; 