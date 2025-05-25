const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  taxRate: {
    type: Number,
    required: true,
    default: 10, // Default 10%
    min: 0,
    max: 100
  },
  currency: {
    type: String,
    required: true,
    default: 'NPR'
  },
  currencySymbol: {
    type: String,
    required: true,
    default: 'Rs.'
  },
  shippingFee: {
    type: Number,
    required: true,
    default: 0
  },
  minOrderAmount: {
    type: Number,
    required: true,
    default: 0
  },
  maxOrderAmount: {
    type: Number,
    default: null
  },
  isMaintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'Site is under maintenance. Please check back later.'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings; 