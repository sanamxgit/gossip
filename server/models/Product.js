const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  photos: [{
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  helpful: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  sellerReply: {
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
});

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be positive']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price must be positive']
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  sold: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    }
  }],
  colors: [{
    name: String,
    code: {
      type: String,
      required: true
    },
    image: String
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Product brand is required']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller information is required']
  },
  rating: {
    type: Number,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  reviews: [reviewSchema],
  isFeatured: {
    type: Boolean,
    default: false
  },
  specifications: {
    type: Array,
    default: []
  },
  arModels: {
    ios: {
      url: String,
      public_id: String
    },
    android: {
      url: String,
      public_id: String
    },
    web: {
      url: String,
      public_id: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

// Update the updatedAt field on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for discounted price calculation
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Calculate average rating when reviews are modified
productSchema.pre('save', function(next) {
  if (this.reviews.length > 0) {
    this.rating = this.reviews.reduce((acc, item) => item.rating + acc, 0) / this.reviews.length;
    this.numReviews = this.reviews.length;
  } else {
    this.rating = 0;
    this.numReviews = 0;
  }
  next();
});

// Index for faster searches
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ rating: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 