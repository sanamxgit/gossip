const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SellerApplicationSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    storeName: {
      type: String,
      required: true,
      trim: true
    },
    storeDescription: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    address: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String
      },
      postalCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      }
    },
    storeImage: {
      type: String
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SellerApplication', SellerApplicationSchema); 