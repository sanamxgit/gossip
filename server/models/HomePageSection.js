const mongoose = require('mongoose');

const homepageSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['banner', 'categories', 'products', 'icon-categories', 'custom'],
    default: 'custom'
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  },
  order: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
homepageSectionSchema.index({ order: 1 });
homepageSectionSchema.index({ active: 1 });

// Example content structure for different section types:
// 
// Banner:
// {
//   slides: [
//     {
//       imageUrl: String,
//       title: String,
//       subtitle: String,
//       buttonText: String,
//       buttonLink: String
//     }
//   ]
// }
//
// Categories:
// {
//   categories: [
//     {
//       name: String,
//       description: String,
//       image: String
//     }
//   ]
// }
//
// Products:
// {
//   productIds: [Number]
// }
//
// Icon Categories:
// {
//   categories: [
//     {
//       name: String,
//       imageUrl: String,
//       icon: String,
//       link: String
//     }
//   ]
// }

const HomepageSection = mongoose.model('HomepageSection', homepageSectionSchema);

module.exports = HomepageSection; 