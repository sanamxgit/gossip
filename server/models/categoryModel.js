const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    image: {
      url: {
        type: String,
        required: false,
      },
      public_id: {
        type: String,
        required: false,
      },
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    productCount: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 0,
    },
    path: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update level and path
categorySchema.pre('save', async function(next) {
  if (this.parent) {
    const parent = await this.constructor.findById(this.parent);
    if (parent) {
      this.level = parent.level + 1;
      this.path = [...parent.path, parent._id];
    }
  }
  next();
});

// Update product count when products are added/removed
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ category: this._id });
  this.productCount = count;
  await this.save();
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 