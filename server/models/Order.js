const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: { type: String, required: true },
      image: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    }
  ],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  statusUpdates: [
    {
      status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
      },
      date: {
        type: Date,
        default: Date.now
      },
      note: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  reviewed: {
    type: Boolean,
    default: false
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// Pre-save middleware to update statusUpdates
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusUpdates.push({
      status: this.status,
      date: new Date(),
      updatedBy: this.updatedBy || this.user
    });
  }
  next();
});

// Virtual for order tracking
orderSchema.virtual('trackingInfo').get(function() {
  return this.statusUpdates.sort((a, b) => b.date - a.date);
});

// Method to update order status
orderSchema.methods.updateStatus = function(status, note = '') {
  this.status = status;
  this.statusUpdates.push({
    status,
    date: new Date(),
    note
  });

  if (status === 'Delivered') {
    this.isDelivered = true;
    this.deliveredAt = Date.now();
  }

  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 